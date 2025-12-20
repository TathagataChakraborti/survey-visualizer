from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import List
from schemas import (
    Embedding,
    EmbeddingRequest,
    Domain,
    RequestData,
    NewPaperData,
    Neighbor,
    Transform,
)

import os
import json
import importlib


app = Flask(__name__)
CORS(app)

app.config["CORS_HEADERS"] = "Content-Type"


@app.route("/hello", methods=["POST"])
def hello():
    return jsonify({"status": True})


@app.route("/embeddings", methods=["POST"])
def embeddings() -> List[Embedding]:
    payload = EmbeddingRequest.model_validate(
        json.loads(request.get_data().decode("utf-8"))
    )

    list_of_embeddings: List[Embedding] = []
    new_paper_data = payload.imagination

    neighbor_pos = [
        list(filter(lambda e: e.UID == neighbor.UID, list_of_embeddings))[0]
        for neighbor in new_paper_data.neighbors
    ]

    x, y = 0, 0
    for pos in neighbor_pos:
        x, y = pos["x"] / len(neighbor_pos), pos["y"] / len(neighbor_pos)

    list_of_embeddings.append(Embedding(UID=0, x=x, y=y))
    return list_of_embeddings


@app.route("/imagine", methods=["POST"])
def imagine() -> List[NewPaperData]:
    data = RequestData.model_validate(json.loads(request.get_data().decode("utf-8")))
    domain = Domain(data.domain).value.lower()

    caller = str(request.remote_addr).replace(".", "_")

    approach2uid = {}
    for paper in data.paper_data:
        approach2uid[paper.slug.lower().replace("-", "_")] = int(paper.UID)

    imagine_paper = importlib.import_module(f"{domain}_encoded")
    result = imagine_paper.find_k_new_papers(data.num_papers, caller)

    new_result: List[NewPaperData] = []
    for res in result:
        keymap = []
        for i, digit in enumerate(res["entry"].split(",")):
            if digit == "1":
                keymap.append(imagine_paper.all_features[i].name)
        new_neighbours: List[Neighbor] = []
        for n in res["neighbours"]:
            new_neighbours.append(Neighbor(UID=approach2uid[n]))
            for f in res["neighbours"][n]:
                new_neighbours[-1].transforms.append(
                    Transform(key=f, value=res["neighbours"][n][f])
                )

        new_result.append(
            NewPaperData(
                key_map=keymap,
                neighbors=new_neighbours,
            )
        )

    return new_result


if __name__ == "__main__":
    app.run(debug=False, port=int(os.getenv("PORT", 1234)), host="0.0.0.0")
