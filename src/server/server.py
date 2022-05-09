from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from typing import Dict, TypedDict
from schemas import *

import os
import json
import importlib


app = Flask(__name__)
CORS(app)

app.config["CORS_HEADERS"] = "Content-Type"


@app.route("/")
def hello_world():
    return "<p>Survey Visualizer</p>"


@app.route("/embeddings", methods=["POST"])
def embeddings() -> List[Embedding]:

    payload: EmbeddingRequest = json.loads(request.get_data().decode("utf-8"))

    new_paper_data = payload["imagination"]
    embeddings = [
        Embedding(UID=embedding["UID"], x=embedding["pos"][0], y=embedding["pos"][1])
        for embedding in payload["embeddings"]
    ]

    neighbor_pos = [
        list(filter(lambda x: x["UID"] == neighbor["UID"], embeddings))[0]
        for neighbor in new_paper_data["neighbors"]
    ]

    x, y = 0, 0
    for pos in neighbor_pos:
        x, y = pos["x"] / len(neighbor_pos), pos["y"] / len(neighbor_pos)

    embeddings.append(Embedding(UID=0, x=x, y=y))
    return jsonify(embeddings)


@app.route("/imagine", methods=["POST"])
def imagine() -> NewPaperData:

    data: RequestData = json.loads(request.get_data().decode("utf-8"))

    domain = Domain.map_to_value(data["domain"])
    caller = str(request.remote_addr).replace(".", "_")

    approach2uid = {}
    for paper in data["paper_data"]:
        approach2uid[paper["slug"].lower().replace("-", "_")] = int(paper["UID"])

    imagine = importlib.import_module(f"{domain}_encoded")
    result = imagine.find_k_new_papers(data["num_papers"], caller)

    new_result = []
    for res in result:
        keymap = []
        for (i, digit) in enumerate(res["entry"].split(",")):
            if digit == "1":
                keymap.append(imagine.all_features[i].name)
        new_neighbours = []
        for n in res["neighbours"]:
            new_neighbours.append({"UID": approach2uid[n], "transforms": []})
            for f in res["neighbours"][n]:
                new_neighbours[-1]["transforms"].append(
                    {"key": f, "value": res["neighbours"][n][f]}
                )
        new_result.append(
            {
                "key_map": keymap,
                "neighbors": new_neighbours,
            }
        )

    return jsonify(new_result)


if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PORT", 1234)), host="0.0.0.0")
