from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin

from sentence_transformers import SentenceTransformer
from typing import Dict, TypedDict

from schemas import *

# from vam_hri_encoded import find_k_new_papers as vam_hri_find_k_new_papers
# from xaip_encoded import find_k_new_papers as xaip_find_k_new_papers

import os
import json
import decimal
import importlib

import sklearn.manifold
import torch


app = Flask(__name__)
CORS(app, support_credentials=True)

print("Loading Transformer Model...")
model = SentenceTransformer("allenai-specter")


@app.route("/")
def hello_world():
    return "<p>Survey Visualizer</p>"


@app.route("/embeddings", methods=["POST"])
def embeddings() -> List[Embedding]:
    def handle_decimals(obj):
        # Lambda will automatically serialize decimals so we need
        # to support that as well.
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return obj

    payload: EmbeddingRequest = json.loads(request.get_data().decode("utf-8"))
    new_paper_data = payload["imagination"]
    new_tags = set()

    for tag_train in new_paper_data:
        new_tags = new_tags.union(tag_train.split(" > ")[-1])

    new_paper = Paper(UID=0, tags=[{"name": tag} for tag in new_tags])

    paper_list = payload["paper_data"]
    paper_list.append(new_paper)

    papers = [
        "[SEP]".join([tag["name"] for tag in paper["tags"]]) for paper in paper_list
    ]
    embeddings = model.encode(papers, convert_to_tensor=True)

    print("Generating Transforms...")
    transform = sklearn.manifold.TSNE(n_components=2).fit_transform(
        embeddings.cpu().numpy()
    )

    out_data = dict()
    for i, row in enumerate(paper_list):
        out_data[row["UID"]] = Embedding(
            _id=row["UID"],
            x=transform[i].tolist()[0],
            y=transform[i].tolist()[1],
        )

    return jsonify(out_data)


@app.route("/imagine", methods=["POST"])
@cross_origin(supports_credentials=True)
def imagine() -> NewPaperData:

    data: RequestData = json.loads(request.get_data().decode("utf-8"))

    domain = Domain.map_to_value(data["domain"])
    caller = str(request["remote_addr"]).replace(".", "_")

    approach2uid = {}
    for paper in data["paper_data"]:
        approach2uid[paper["slug"]] = int(paper["UID"])

    imagine = importlib.import_module(f"{domain}_encoded")
    result = imagine.find_k_new_papers(data["num_papers"], caller)

    new_result = []

    for res in result:
        keymap = []
        for (i, digit) in enumerate(res["entry"].split(',')):
            if digit == "1":
                keymap.append(imagine.all_features[i].name)
        new_neighbours = []
        for n in res["neighbours"]:
            new_neighbours.append({"UID": approach2uid[n], "transforms": []})
            for f in res["neighbours"][n]:
                new_neighbours[-1]["transforms"].append({"key": f, "value": res["neighbours"][n][f]})
        new_result.append(
            {
                "key_map": keymap,
                "neighbours": new_neighbours,
            }
        )


    # imagine = json.loads(open("temp.json").read())

    return json.dumps(new_result)


if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PORT", 1234)), host="0.0.0.0")
