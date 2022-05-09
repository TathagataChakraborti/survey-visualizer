# Configuration

A sample `config.yaml` file is provided [here](./config.yaml).
Currently, the system admits a spreadsheet
that is organized as a list of papers (rows) underneath a set of categories (columns)
where for each row, each cell is marked depending on whether that paper belongs to
the category on that column or not.

[Here](./compiler/data/) is a couple of sample spreadsheets.

<img width="100%" src="https://user-images.githubusercontent.com/4764242/156827843-26543026-b075-4729-9de6-ea847fa46a37.png">

## Metadata

This part is pretty self-explantory

```yaml
metadata:
  acronym: VAMHRI
  name: VAM-HRI
  title_text:
    'Virtual, Augmented, and Mixed Reality for Human-Robot Interaction:
    A Survey and Virtual Design Element Taxonomy'
  citation_text:
    "@inproceedings{vam-hri, \n title={{Virtual, Augmented, and Mixed
    Reality\n\t for Human-Robot Interaction: A Survey\n\t and Virtual Design Element
    Taxonomy}}, \n author={Michael Walker and Thao Phung and \n\t Tathagata Chakraborti
    and Tom \n\t Williams and Daniel Szafir}, \n booktitle={arXiv:2202.11249}, \n
    year={2022}}"
  link_to_contribute: https://github.com/miwalker/survey-visualizer/issues/new/choose
  link_to_code: https://github.com/TathagataChakraborti/survey-visualizer
  primary_link: https://arxiv.org/abs/2202.11249
  secondary_links:
    - name: The Reality-Virtuality Interaction Cube
      link: https://ieeexplore.ieee.org/document/8673071
  info_tile: true
  info_text: Learn more about the VAM-HRI Workshop Series at HRI 2018-present
  info_link:
    - link: https://ojs.aaai.org//index.php/aimagazine/article/view/2822
      text: How it started
    - link: https://vam-hri.github.io/
      text: How it's going
```

The `name` field appears as the title of the webpage (name of the tab on your browser). The rest of these fields
appear as follows on the left-hand side [[example](http://ibm.biz/vam-hri)] as a gateway to the survey resources for the particular deployment:

<img width="100%" alt="image" src="https://user-images.githubusercontent.com/4764242/156827296-eb24127f-d008-4a57-b60f-035f4c009647.png">

The primary link should point to the survey paper this deployment is built upon. You can have more than one secondary link,
pointing to other papers, or links, that may be of interest.

Note that the `link to contribute` field should lead directly to wherever the author of the survey want people to go to make
further contributions or get in touch. In this example, it's a [fork](https://github.com/miwalker/survey-visualizer) of this library which hosts
a [deployment](http://ibm.biz/vam-hri) for [this](https://arxiv.org/abs/2202.11249) paper.

## Views

The next part of the configuration deals with how each view is built. First, set the default view, and from how far back you
want to go (this is lower bound, the page will adjust to the earliest paper it finds on the spreadsheet, as seen in green below).
The tab to switch views appears on the top-left and the page will load with the default specified.

```yaml
default_view: Taxonomy
min_year: 1984
```

<img width="100%" alt="image" src="https://user-images.githubusercontent.com/4764242/156828808-280f161c-a77c-4b6d-b8fa-0be397c0a1fd.png">

### Taxonomy

This is the method of classification used in the survey. There migtht be multiple such classifications used in the survey, as is the case
in the provided sample config file. Each occur as a separate tab within that view (seen in green below).

**Default Tab** First, you need to specifiy which among the specified tabs to use as the default classification scheme. This view will open
with this tab as default. _This classification will be used as the basis for the Affinity and Network views as well._

```yaml
- name: Taxonomy
  disabled: false
  default_tab: Taxonomy
```

<img width="100%" alt="image" src="https://user-images.githubusercontent.com/4764242/156831328-0b5d9f24-b7d5-48f9-b8b8-40066daeb56f.png">

```yaml
tabs:
  - tab_name: Taxonomy
    title_text: Taxonomy View of VAM-HRI Interation Design Elements
    root_text: Design Element
    disabled: false
    fancy_chart: false
    input_file:
      filename: data/slug.xlsx
      relative: true
      active_worksheet: Cubed - Thao
    papers_list:
      shuffle_list: true
      key_map:
        title: 3
        abstract:
        authors: 2
        venue: 1
        sessions:
        year: 0
        keywords:
      rows:
        start: 7
        stop: 184
        exclude:
          - 141
          - 151
    taxonomy:
      rows:
        start: 1
        stop: 6
        exclude:
          - 5
          - 6
      columns:
        start: 69
        stop: 146
```

For each tab in the Taxonomy view, you can provide a link to the spreadsheet (and corresponding active sheet) to read from.
The path to the file can be either marked relative to the directory you are running the compiler from i.e. this/path/compiler/...
or can be an absolute path.

The rows and columns (for either of the taxonomy area or the paper list) indicate the start and end of where to read from
in the spreadsheet, as well as rows / columns to ignore if required.
For example, we are asking here to read the "Taxonomy" hierarchy from rows 1-6 (but ignore rows 5 and 6)
and columns 69 to 146, and the rows 7-184 (excluding 141 and 151) for the list of papers.
The `key_map` entry indicates where (columns) the paper metadata is documented in the spreadsheet (e.g. the title is in column 3).

The `shuffle_list` key, if _True_, will make the paper list appear in randomized order. If disabled, the papers on the visualizer
appear in the order they are given in the source spreadsheet.

**Fancy Charts**

You can also enable other views into your taxonomy, such as
using [tree maps](https://www.carbondesignsystem.com/data-visualization/complex-charts/#tree-maps) and [circle packs](https://www.carbondesignsystem.com/data-visualization/complex-charts/#circle-packs). The `fancy_chart_default_level` key dictates at what level of the taxonomy (1 being the highest)
the chart is initialized.

```yaml
- tab_name: Hardware
  title_text: Taxonomy View of VAM-HRI Interation Design Elements
  disabled: false
  fancy_chart: true
```

<img width="100%" alt="image" src="https://user-images.githubusercontent.com/4764242/156831739-a02f0d6e-85f4-412b-8dfa-12cbc9f888c4.png">

---

🚨 **What if your survey does not have a classification?** Don't worry! You can just put a list of papers as under a
single class and everything should work fine. Remember to disable the Taxonomy view and mark one of the other ones as the default view.

---

### Affinity

The affinity tab is meant to provide a view of the papers in the spreadsheet in the space of document similarity.
Here "document" equates to the paper metadata provided in the spreadsheet. This view is inspired from
the [Miniconf](https://github.com/Mini-Conf/Mini-Conf/tree/master/scripts) repository.

> The tags here (highlighted in red) are derived from the default taxonomy you picked in the previous step.

```
- name: Affinity
  disabled: false
```

<img width="100%" alt="image" src="https://user-images.githubusercontent.com/4764242/156833144-f34bf89b-3a47-4655-b214-ec79756858f6.png">

### Network

The final view, shows a citations network between papers included in the survey. This is extracted automatically from the PDFs of the papers
and is a bit noisy due to varying PDF formats. The extraction is done as a best guess basis (favoring low false negatives with a bit of high false positive).
You should specify the path (either relative to the compiler script, or absolute) to the PDFs in the `files_directory` field.

You can change the `match_threshold` to make the best guess more strict. A `0.25` value means that, for all the bits of strings found in the paper
in the "References" sections, a paper title in the known paper list has to be changed **at most** 25% of itself in order to match, to be considered a potential
reference (with the lowest match below that threshold taken as the matched reference).

```yaml
- name: Network
  files_directory:
    location: data/pdfs
    relative: true
  match_threshold: 0.25
  disabled: false
```

> As in the previous case, the tags come from the default taxonomy specified previously.

<img width="100%" alt="image" src="https://user-images.githubusercontent.com/4764242/156834482-37b15962-83cf-464d-892a-50610791b49b.png">

---

Wanna add a new view? Start a new [feature request](https://github.com/TathagataChakraborti/survey-visualizer/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=). 🤗
