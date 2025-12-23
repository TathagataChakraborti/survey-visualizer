from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from schemas import  (
    ServerStatus,
    Embedding,
    EmbeddingRequest,
    Domain,
    RequestData,
    NewPaperData,
    Neighbor,
    Transform,
)

import importlib

app = FastAPI(
    title="Toby Server",
    description="Backend to accompany Toby.",
    version="0.0.0",
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/hello")
def hello() -> ServerStatus:
    return ServerStatus(status=True)


@app.post("/embeddings")
def embeddings(payload: EmbeddingRequest) -> List[Embedding]:
    new_paper_data = payload.imagination

    neighbor_pos: List[Embedding] = [
        list(filter(lambda e: e.UID == neighbor.UID, payload.embeddings))[0]
        for neighbor in new_paper_data.neighbors
    ]

    x, y = 0, 0
    for pos in neighbor_pos:
        x, y = pos.x / len(neighbor_pos), pos.y / len(neighbor_pos)

    payload.embeddings.append(Embedding(UID=0, x=x, y=y))
    return payload.embeddings


@app.post("/imagine")
def imagine(info: Request, data: RequestData) -> List[NewPaperData]:
    domain = Domain(data.domain).value.lower()
    caller = info.client.host.replace(".", "_")

    approach2uid = {}
    for paper in data.paper_data:
        approach2uid[paper.slug] = paper.UID

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
