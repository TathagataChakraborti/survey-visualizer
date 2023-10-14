# Survey Visualizer

[![IBM](https://img.shields.io/badge/IBM%20Research-AI-blue)](https://research.ibm.com)
[![Carbon](https://img.shields.io/badge/Carbon-black)](https://www.carbondesignsystem.com)

This repository hosts the source code for a generic visualization tool for data from survey papers, for readers to explore on the browser.
It accepts as input a formatted spreadsheet and produces several views in terms of a hierarchy of concepts,
document concept similarity, and citation network. See [example deployments](#active-deployments) below.

## Setting up locally

### Generate files for the Frontend

First, you need to provide a configuration file and the source spreadsheet to generate the data for the frontend.

1. Put all your spreadsheets in [this directory](./src/compiler/data/) and your PDFs (if available) in [this directory](./src/compiler/pdfs/). Some sample files have been kept there for you. Or use absolute paths (see how to configure in the next step) to point to where your file are.
2. Configure your `config.yaml`. See [here](./src/compiler/data/vamhri.yaml) for an example. Detailed instructions on how to configure your system are available [here](./src/README.md).

3. Then run the following:

```bash
user:~$ pip install -r src/compiler/requirements.txt
user:~$ python src/compiler/compile.py --file /path/to/config/file
```

### Bringing up the server

1. Then run the following:
2. Your survey visualizer will show up locally on [localhost:3000](http://localhost:3000). 😍
3. For deployment, refer to the [active deployments](#active-deployments) listed below.

```bash
user:~$ yarn
user:~$ yarn start
```

## How to Contribute

You can contribute in two forms:

1. Directly to this code base for new features, bug fixes, etc. Open an issue [here](https://github.com/TathagataChakraborti/survey-visualizer/issues/new/choose).
2. To the surveys that pull from this code base, in the form of new paper entries, updates to the taxonomies, and so on. See below for a list of active deployments.

### Active Deployments

| Topic | Link | Contribute |
|:------|:-----|:-----------|
| <br/> Virtual, Augmented, and Mixed-Reality for <br/> Human-Robot Interaction <br/> <br/> [`paper`](https://arxiv.org/abs/2202.11249) [`paper`](https://ieeexplore.ieee.org/document/8673071) <br/><br/>  | [vamhri.com](https://vamhri.com) | [Contribute](https://github.com/TathagataChakraborti/survey-visualizer/issues/new/choose) |
| <br/> Explainable AI Planning <br/> <br/> [`paper`](https://www.ijcai.org/Proceedings/2020/669) [`paper`](https://ojs.aaai.org//index.php/ICAPS/article/view/3463) <br/> <br/> | [explainableplanning.com](https://explainableplanning.com) | [Contribute](https://github.com/TathagataChakraborti/survey-visualizer/issues/new/choose) |
| <br/> Model Acquisition for Planning <br/> <br/> [`paper`](https://drive.google.com/file/d/1WqO-PWbE7uhHVbSRnqGcJkQN2-Hpquh2/view?usp=sharing) <br/> <br/> | [macq.planning.domains](https://macq.planning.domains) | [Contribute](https://github.com/QuMuLab/macq) |

## How to Cite

[`download`](https://arxiv.org/abs/2306.10051)

If you end up using this work, please remember to cite us as follows:

```
@article{toby,
 title={{TOBY: A Tool for Exploration of Data from Academic Survey Papers}},
 author={Tathagata Chakraborti and Jungkoo Kang and Christian Muise and Sarath Sreedhatan and Michael Walker and Daniel Szafir and Tom Williams},
 journal={arXiv:2306.10051},
 year={2023}}
```
