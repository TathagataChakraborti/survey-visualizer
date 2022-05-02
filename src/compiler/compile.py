from schemas import *

from Levenshtein import distance as lev
from openpyxl import load_workbook
from typing import Dict
from sentence_transformers import SentenceTransformer

import sklearn.manifold
import torch

import pdfplumber
import copy
import pathlib
import random
import argparse
import yaml
import json
import glob
import csv
import os
import re

__cache: Dict = dict()
__embeddings: List[Embedding] = list()


def __text_transform(text: str) -> str:
    text = text.replace("\n", " ").replace("-", "").lower()
    text = " ".join(text.split())

    return text


def getTaxonomy(config: Dict) -> List[Taxonomy]:
    def __generate_random_id() -> int:
        return row_number

    def __compute_parent(
        start_id: int, stop_id: int, row_number: int, data: Dict
    ) -> str:

        if data:

            parent_candidates = data[-1]

            for parent in parent_candidates:
                if start_id >= parent["start"] and stop_id <= parent["stop"]:
                    return parent["name"]

        return None

    global __cache
    out_data = list()

    for tab in config["tabs"]:

        print(f"Generating Taxonomy view for {tab['tab_name']}...")

        new_taxonomy = Taxonomy(
            name=tab["tab_name"],
            data=list(),
            taxonomy=list(),
        )

        path = os.path.abspath(tab["input_file"]["filename"])
        wb = load_workbook(path, data_only=True)
        sheet = wb[tab["input_file"]["active_worksheet"]]

        row_number = 0
        for row in sheet.iter_rows(max_row=sheet.max_row):
            row_number += 1

            if (
                row_number >= tab["taxonomy"]["rows"]["start"]
                and row_number <= tab["taxonomy"]["rows"]["stop"]
            ):

                if row_number in tab["taxonomy"]["rows"].get("exclude", []):
                    continue

                row = row[
                    tab["taxonomy"]["columns"]["start"]
                    - 1 : tab["taxonomy"]["columns"]["stop"]
                ]
                current_level = list()

                new_item = None
                name = None
                start = -1
                stop = -1

                for item in row:

                    if item.value:

                        if new_item:
                            current_level.append(new_item)
                            new_item = None

                        if not new_item:

                            name = item.value
                            start = tab["taxonomy"]["columns"]["start"] + row.index(
                                item
                            )
                            stop = start

                            new_item = Element(
                                name=name,
                                expanded=True,
                                parent=__compute_parent(
                                    start, stop, row_number, new_taxonomy["taxonomy"]
                                ),
                                level=len(new_taxonomy["taxonomy"]) + 1,
                                start=start,
                                stop=stop,
                            )

                    if item.value is None and new_item is not None:
                        new_item["stop"] = tab["taxonomy"]["columns"][
                            "start"
                        ] + row.index(item)

                if new_item:
                    current_level.append(new_item)

                new_taxonomy["taxonomy"].append(current_level)

            if (
                row_number >= tab["papers_list"]["rows"]["start"]
                and row_number <= tab["papers_list"]["rows"]["stop"]
            ):

                if row_number in tab["papers_list"]["rows"].get("exclude", []):
                    continue

                existing_ids = [item["UID"] for item in new_taxonomy["data"]]
                new_id = __generate_random_id()

                while new_id in existing_ids:
                    new_id = __generate_random_id()

                new_paper = Paper(
                    UID=new_id,
                    citations=list(),
                    selected=True,
                )

                key_map = tab["papers_list"]["key_map"]

                for key in key_map:
                    if key_map[key] is not None:
                        new_paper[key] = row[key_map[key]].value
                    else:
                        new_paper[key] = None

                if "year" in key_map:
                    new_paper["year"] = int(new_paper["year"])

                if "slug" not in key_map:
                    new_paper["slug"] = f"paper-{new_id}"

                tags = list()
                for item in row:
                    if item.value:

                        for taxonomic_level in new_taxonomy["taxonomy"]:
                            for taxonomic_item in taxonomic_level:

                                if (
                                    row.index(item) + 1 >= taxonomic_item["start"]
                                    and row.index(item) + 1 <= taxonomic_item["stop"]
                                ):

                                    new_tag_item = {
                                        "name": taxonomic_item["name"],
                                        "parent": taxonomic_item["parent"],
                                    }

                                    if new_tag_item not in tags:
                                        tags.append(new_tag_item)

                new_paper["tags"] = tags
                new_taxonomy["data"].append(new_paper)

        if tab["papers_list"].get("shuffle_list", False):
            random.shuffle(new_taxonomy["data"])

        out_data.append(new_taxonomy)

        if tab["tab_name"] == config["default_tab"]:
            __cache = new_taxonomy

    return out_data


def getAffinity(config: Dict, taxonomy: Taxonomy = __cache):

    if not taxonomy:
        taxonomy = __cache

    global __embeddings

    new_paper_list = list()
    for paper in taxonomy["data"]:
        new_paper: Paper = copy.deepcopy(paper)

        new_paper["abstract"] = paper.get("abstract") or paper["title"]
        new_paper["authors"] = paper["authors"].replace(",", " | ")

        new_paper["keywords"] = paper.get("keywords") or " | ".join(
            [tag["name"] for tag in paper.get("tags", [])]
        )
        new_paper["sessions"] = paper.get("sessions") or paper.get("venue")

        new_paper_list.append(new_paper)

    # Referece: https://github.com/Mini-Conf/Mini-Conf/tree/master/scripts
    print("Loading Transformer Model...")
    model = SentenceTransformer("allenai-specter")
    papers = [
        "[SEP]".join(
            [
                paper[key] if type(paper[key]) == str and key != "UID" else ""
                for key in paper
            ]
        )
        for paper in new_paper_list
    ]
    embeddings = model.encode(papers, convert_to_tensor=True)

    print("Generating Transforms...")
    transform = sklearn.manifold.TSNE(n_components=2).fit_transform(
        embeddings.cpu().numpy()
    )

    out_data = []
    for i, row in enumerate(new_paper_list):
        out_data.append({"UID": row["UID"], "pos": transform[i].tolist()})

    __embeddings = out_data
    return out_data


def getNetwork(config: Dict, taxonomy: Taxonomy = __cache):

    if not taxonomy:
        taxonomy = __cache

    network_data = Network(nodes=list(), links=list())

    for paper in taxonomy["data"]:
        network_data["nodes"].append(paper)

    path = os.path.abspath(config["files_directory"])
    match_threshold = config["match_threshold"]
    columns_per_page = [2, 1]

    # Reference: https://stackoverflow.com/a/69316574
    x0 = 0  # Distance of left side of character from left side of page.
    x1 = 0.5  # Distance of right side of character from left side of page.
    y0 = 0  # Distance of bottom of character from bottom of page.
    y1 = 1  # Distance of top of character from bottom of page.

    files_to_read = glob.glob(f"{path}/*.pdf")

    for file in files_to_read:
        print(f"Parsing {files_to_read.index(file)+1}/{len(files_to_read)} papers...")

        current_title = None
        current_id = None
        reference_map = []

        with pdfplumber.open(file) as pdf:
            for i, page in enumerate(pdf.pages):
                start_references = False
                transformed_text = None

                for columns in columns_per_page:

                    text = page.extract_text()
                    transformed_text = __text_transform(text)

                    if columns == 2:

                        try:

                            # Reference: https://stackoverflow.com/a/69316574
                            width = page.width
                            height = page.height

                            # Crop pages
                            left_bbox = (
                                x0 * float(width),
                                y0 * float(height),
                                x1 * float(width),
                                y1 * float(height),
                            )
                            page_crop = page.crop(bbox=left_bbox)
                            left_text = page_crop.extract_text()

                            left_bbox = (
                                0.5 * float(width),
                                y0 * float(height),
                                1 * float(width),
                                y1 * float(height),
                            )
                            page_crop = page.crop(bbox=left_bbox)
                            right_text = page_crop.extract_text()
                            page_context = "\n".join([left_text, right_text])
                            transformed_text = __text_transform(page_context)

                        except:
                            pass

                    if i == 0:

                        for paper in taxonomy["data"]:
                            title_transform = __text_transform(paper["title"])

                            if title_transform in transformed_text:
                                current_title = paper["title"]
                                current_id = paper["UID"]
                                break

                    if "references" in transformed_text:
                        transformed_text = transformed_text.split("references")[-1]
                        start_references = True

                    if start_references and current_title:
                        reference_list = transformed_text.split(".")

                        for reference in reference_list:

                            reference_map_item = None
                            extract_title = re.findall(
                                '(“|")(?P<title>.*)(”|").*', reference
                            )

                            if not extract_title:
                                extract_title = reference
                            else:
                                extract_title = extract_title[0]

                            current_match_score = match_threshold

                            for paper in taxonomy["data"]:

                                candidate_reference_title_transform = __text_transform(
                                    paper["title"]
                                )
                                new_match_score = lev(
                                    reference, candidate_reference_title_transform
                                ) / len(candidate_reference_title_transform)

                                if new_match_score < current_match_score:
                                    current_match_score = new_match_score

                                    reference_map_item = {
                                        "reference_title": reference,
                                        "papers_title": paper["title"],
                                        "reference_id": paper["UID"],
                                        "match_score": current_match_score,
                                    }

                            if current_match_score < match_threshold:
                                reference_map.append(reference_map_item)

        if current_title:
            for reference in reference_map:
                new_link = Link(source=current_id, target=reference["reference_id"])

                network_data["links"].append(new_link)

    return network_data


def getInsights(config: Dict, taxonomy: Taxonomy = __cache):
    if __embeddings:
        return __embeddings
    else:
        return getAffinity(config, taxonomy)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compile survey data.")
    parser.add_argument("--file", type=str, help="Path to YAML config file.")

    args = parser.parse_args()
    config = dict()

    with open(args.file, "r") as stream:
        try:
            config = yaml.safe_load(stream)
        except yaml.YAMLError as exc:
            print(exc)

    config_out = os.path.abspath(
        os.path.join(os.path.dirname(os.path.realpath(__file__)), f"./../config.json")
    )
    open(config_out, "w").write(json.dumps(config, indent=4))

    for view in config["views"]:
        view_name = view["name"]
        out_file = os.path.abspath(
            os.path.join(
                os.path.dirname(os.path.realpath(__file__)),
                f"./data/{view_name}.json",
            )
        )

        if not view["disabled"]:
            print(f"Generating {view_name} view...")
            output = eval(f"get{view_name}({view})")

        else:
            output = __cache

        print(f"Writing {out_file}...")
        open(out_file, "w").write(json.dumps(output, indent=4))
