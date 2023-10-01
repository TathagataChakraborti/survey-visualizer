from typing import List, Union, Optional
from pydantic import BaseModel


class Paper(BaseModel):
    UID: int = 0
    slug: str = ""
    title: str = ""
    abstract: str = ""
    link: str = ""
    authors: Union[str, List[str]] = ""
    venue: str = ""
    sessions: str = ""
    year: int = 0
    keywords: Union[str, List[str]] = ""
    tags: List[str] = []
    citations: List[int] = []
    selected: bool = True


class Element(BaseModel):
    name: str
    expanded: bool = True
    parent: Optional[str] = None
    level: int
    start: int
    stop: int


class Taxonomy(BaseModel):
    name: str
    taxonomy: List[List[Element]]
    data: List[Paper]


class Node(Paper):
    group: str


class Link(BaseModel):
    source: int
    target: int


class Network(BaseModel):
    nodes: List[Node]
    links: List[Link]


class Embedding(BaseModel):
    UID: int
    x: float
    y: float
