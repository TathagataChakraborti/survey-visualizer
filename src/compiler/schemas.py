from typing import List, Union, Dict, TypedDict


class Paper(TypedDict):
    UID: int
    slug: str
    title: str
    abstract: str
    authors: Union[str, List[str]]
    venue: str
    sessions: str
    year: int
    keywords: Union[str, List[str]]
    tags: List[str]
    citations: List[int]
    selected: bool = True


class Element(TypedDict):
    name: str
    expanded: bool = True
    parent: str = None
    level: int
    start: int
    stop: int


class Taxonomy(TypedDict):
    name: str
    taxonomy: List[List[Element]]
    data: List[Paper]


class Node(Paper):
    group: str


class Link(TypedDict):
    source: str
    target: str
    value: int


class Network(TypedDict):
    nodes: List[Node]
    links: List[Link]
    group_map: Dict


class Embedding(TypedDict):
    UID: int
    x: float
    y: float
