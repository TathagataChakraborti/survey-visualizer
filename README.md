# Survey Visualizer

[![Carbon](https://img.shields.io/badge/design-carbon-blue)](https://www.carbondesignsystem.com/)

This repository hosts the source code for a generic visualization tool for data from survey papers, for readers to explore on the browser.
It accepts as input a formatted spreadsheet and produces several views in terms of hierarchy of concepts,
document concept similarity, and citation network. See [example deployments](#active-deployments) below.

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
3. For deployment, refer to the [active deployments](#active-deployments) listed below.

```bash
user:~$ yarn
user:~$ yarn start
```

## How to Contribute

You can contribute in two forms:

1. Directly to this code base for new features, bug fixes, etc. Open an issue [here](https://github.com/TathagataChakraborti/survey-visualizer/issues/new/choose).
2. To the surveys that pull from this code base, in the form of new paper entires, updates to the taxonomies, and so on. See below for a list of active deployments.

### Active Deployments

| Topic                                                                                                                                                                       | Link                                              | Contribute                                                                            | Community                                                                                                                                                                        |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Virtual, Augmented, and Mixed-Reality for <br/> Human-Robot Interaction [`paper`](https://arxiv.org/abs/2202.11249) [`paper`](https://ieeexplore.ieee.org/document/8673071) | [vamhri.com](http://ibm.biz/vam-hri)              | [Contribute](https://github.com/miwalker/survey-visualizer/issues/new/choose)         | [Slack](https://join.slack.com/t/vam-hri/shared_invite/zt-gjq1jtld-PzxfFywTi0qBF6CUX5julw)                                                                                       |
| Explainable AI Planning [`paper`](https://www.ijcai.org/Proceedings/2020/669) [`paper`](https://ojs.aaai.org//index.php/ICAPS/article/view/3463)                            | [explainableplanning.com](http://ibm.biz/xaipviz) | [Contribute](https://github.com/sarathsreedharan/survey-visualizer/issues/new/choose) | [Slack](https://join.slack.com/t/xaip2021/shared_invite/zt-svdiylde-EwqOBkguynR6jKbi_UKDXA)                                                                                      |
| Model Acquisition for Planning [`paper`](https://drive.google.com/file/d/1WqO-PWbE7uhHVbSRnqGcJkQN2-Hpquh2/view?usp=sharing)                                                | [macq.planning.domains](http://ibm.biz/macqviz)   | [Contribute](https://github.com/QuMuLab/macq)                                         | [Slack](https://join.slack.com/t/theplanningcommunity/shared_invite/enQtNjg0MTIzNTE3MTY4LTQ4YTRiNjhjNmVlNmEwMGMxOTQwNTZlYWM2YTk1YjdkZmIyMTU5MzRjZjYzOWYxMjJkNGM3YTM2MWI0MmM2MGY) |

<!--
## How to Cite

[`download paper`](https://drive.google.com/file/d/1-14v3IwVdNSau6r3_fkU24Rj7qjWWh-1/view?usp=sharing)

If you end up using this work, please remember to cite us as follows:

```
@inproceedings{toby,
 title={{TOBY: A tool for exploration of data from academic survey papers}},
 author={Tathagata Chakraborti and Jungkoo Kang and Christian Muise and Sarath Sreedhatan and Michael Walker and Daniel Szafir and Tom Williams},
 booktitle={Technical Report},
 year={2022}}
```
 -->
