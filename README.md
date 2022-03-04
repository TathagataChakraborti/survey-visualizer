# Survey Visualizer

[![Carbon](https://img.shields.io/badge/design-carbon-blue)](https://www.carbondesignsystem.com/)

This repository hosts the source code for a generic visualization tool for data from survey papers, for readers to explore on the browser. 
It accepts as input a formatted spreadsheet and produces several views in terms of hierarchy of concepts, 
document concept similarity, and citation network. This is an example: [ibm.biz/vam-hri](http://ibm.biz/vam-hri]).


## Setting up locally

### Generate files for the Frontend

First you need to provide a configuration file and the source spreadsheet to generate the data for the frontend.

1. Put all your spreadsheets in [this directory](./src/compiler/data/) and your PDFs (if available) in [this directory](./src/compiler/pdfs/). Some sample files have been kept there for you.
2. Configure your `config.yaml`. See [here](./src/config.yaml) for an example. Detailed instructions on how to configure your system are available [here](./src/README.md).

3. Then run the following:

```bash
user:~$ pip install -r requirements.txt
user:~$ python src/compiler/compile.py --file /path/to/config/file
```

### Bringing up the server

1. Then run the following:
2. Your survey visualizer will show up locally on [localhost:3000](http://localhost:3000). 😍
3. For deployment, refer to the [active forks](#active-forks) listed below.

```bash
user:~$ yarn
user:~$ yarn start
```


## How to Contribute

You can contribute in two forms: 

1. Directly to this code base for new features, bug fixes, etc. Open an issue here.
2. To the surveys that pull from this code base, in the form of new paper entires, updates to the taxonomies, and so on. See below for a list of active forks.

### Active Forks

| Topic | Link | Papers | Contribute |
|-------|------|--------|------------|
| Virtual, Augmented, and Mixed-Reality <br /> for Human-Robot Interaction | [VAM-HRI](https://vam-hri.github.io/) @ HRI | [Link](https://arxiv.org/abs/2202.11249) \| [Link](https://ieeexplore.ieee.org/document/8673071) | [Contribute](https://github.com/miwalker/survey-visualizer#how-to-contribute) |
| Explainable AI Planning | [XAIP](http://ibm.biz/xaip-workshop) @ ICAPS | [Link](https://www.ijcai.org/Proceedings/2020/669) \| [Link](https://ojs.aaai.org//index.php/ICAPS/article/view/3463) | `Coming Soon` |

