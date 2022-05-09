import React from 'react';
import { Link, Tile, Slider, Tag } from 'carbon-components-react';
import { AreaChart } from '@carbon/charts-react';
import { Download16 } from '@carbon/icons-react';

import '@carbon/charts/styles.css';

let config = require('../../config.json');

const tagSensitivity = 5;

const tag_color_percentile_map = {
  red: 60,
  magenta: 50,
  purple: 40,
  blue: 35,
  cyan: 30,
  teal: 25,
  green: 15,
  gray: 10,
  'cool-gray': 5,
  'warm-gray': 0,
};

const tag_size_percentile_map = {
  md: 50,
  sm: 0,
};

function generateURL(file, ext, dir) {
  return `${process.env.PUBLIC_URL}${dir}/${file}.${ext}`;
}

function shuffleArray(array) {
  var newArray = [...array];
  let i = newArray.length - 1;
  for (; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }
  return newArray;
}

function hashID(node, taxonomy) {
  return [node.name, node.parent].join('-child-of-');
}

function unhashID(id) {
  var split_id = id.split('-child-of-');
  return {
    name: split_id[0],
    parent: split_id[1],
  };
}

function getParents(node, taxonomy) {
  if (!node) return [];

  if (node.level === 1) return [];

  var current_parent = node.parent;
  var sliced_data = taxonomy.slice(0, node.level - 1);

  return sliced_data
    .reverse()
    .map((parent_level, level) => {
      const temp_level = parent_level.filter(
        parent => parent.name === current_parent
      );

      if (temp_level[0]) {
        current_parent = temp_level[0].parent;
      } else {
        current_parent = taxonomy[0].name;
      }

      return temp_level;
    })
    .reverse();
}

function getChildren(node, taxonomy) {
  if (!node) return [];

  if (node.level >= taxonomy.length) return [];

  const lower_level_data = taxonomy[node.level];
  const children = lower_level_data.filter(child => child.parent === node.name);

  return children;
}

const PaperInner = props => (
  <p className="paper">
    {props.paper.title} <em>by {props.paper.authors}</em>. {props.paper.venue} (
    {props.paper.year}){' '}
    {props.paper.link && (
      <Link className="hover-cursor" href={props.paper.link} target="_blank">
        <span className="download-icon">
          <Download16 />
        </span>
      </Link>
    )}
  </p>
);

const Paper = props => (
  <Tile className="paper-tile">
    <PaperInner paper={props.paper} />
  </Tile>
);

class Simulate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      years: props.years,
      slide_on: false,
      options: {
        toolbar: {
          controls: [],
        },
        height: '75px',
        grid: {
          x: {
            enabled: false,
          },
          y: {
            enabled: false,
          },
        },
        axes: {
          bottom: {
            visible: false,
            title: '2019 Annual Sales Figures',
            mapsTo: 'date',
            scaleType: 'time',
          },
          left: {
            visible: false,
            mapsTo: 'value',
            scaleType: 'linear',
          },
        },
        color: {
          gradient: {
            enabled: true,
          },
        },
        points: {
          enabled: false,
        },
        legend: {
          enabled: false,
        },
      },
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.data !== prevProps.data) {
      this.setState({
        ...this.state,
        data: this.props.data,
        years: this.props.years,
      });
    } else if (this.props.years !== prevProps.years) {
      this.setState({
        ...this.state,
        years: this.props.years,
      });
    }

    if (this.props.slide_on !== prevProps.slide_on)
      this.setState({
        ...this.state,
        slide_on: this.props.slide_on,
      });
  }

  handleSimulate(e) {
    this.props.handleSimulate(e.value);
  }

  getTimeline(e) {
    const current_year = new Date().getFullYear();

    var years = [...Array(current_year + 1 - config.min_year).keys()].map(e => {
      return e + config.min_year;
    });
    var data = {};

    const paper_data = this.state.data;

    years.forEach(e => {
      data[e] = 0;
    });

    if (paper_data)
      paper_data.forEach(paper => {
        data[parseInt(paper.year)] += 1;
      });

    data = Object.keys(data).map(e => {
      return { group: 1, date: e, value: data[e] };
    });

    return data;
  }

  render() {
    return (
      <>
        <div className="bx--col-lg-6">
          <Slider
            labelText={config['metadata']['acronym'] + ' through the years'}
            hideTextInput
            onChange={this.handleSimulate.bind(this)}
            min={this.state.years.min_val}
            max={this.state.years.max_val}
            value={this.state.years.cur_val}
            step={1}
          />
        </div>

        <div
          className={
            'bx--col-lg-6 ' + (!this.state.slide_on && ' display_none')
          }>
          <AreaChart
            data={this.getTimeline()}
            options={this.state.options}></AreaChart>
        </div>
      </>
    );
  }
}

class TagArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      selected_tags: [],
      filter_tags: [],
    };
  }

  componentDidMount(props) {
    this.updateTagNumbers();
  }

  updateTagSelection(e) {
    this.props.updateTagSelection(this.state.filter_tags);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.data !== prevProps.data) {
      this.setState(
        {
          data: this.props.data,
        },
        () => {
          this.updateTagNumbers();
        }
      );
    }
  }

  determineTagSize(tag) {
    const tag_mass = Object.keys(this.state.selected_tags).reduce(
      (mass, key) => mass + this.state.selected_tags[key],
      0
    );
    const is_big =
      this.state.selected_tags[tag] >
      tag_mass / Object.keys(this.state.selected_tags).length;

    var percentile = 0;
    var new_size = 'sm';

    if (is_big) percentile = 50;

    Object.keys(tag_size_percentile_map).some(size => {
      if (percentile >= tag_size_percentile_map[size]) {
        new_size = size;
        return true;
      }

      return false;
    });

    return new_size;
  }

  determineTagColor(tag) {
    const tag_mass = Object.keys(this.state.selected_tags).reduce(
      (mass, key) => mass + this.state.selected_tags[key],
      0
    );
    const percentile =
      (tagSensitivity * 100 * this.state.selected_tags[tag]) / tag_mass;

    var new_color = 'sm';

    Object.keys(tag_color_percentile_map).some(color => {
      if (percentile >= tag_color_percentile_map[color]) {
        new_color = color;
        return true;
      }

      return false;
    });

    return new_color;
  }

  onClickTag(e) {
    const current_filter = this.state.filter_tags;

    if (current_filter.indexOf(e) === -1) {
      current_filter.push(e);

      this.setState(
        {
          ...this.state,
          filter_tags: current_filter,
        },
        () => {
          this.updateTagSelection();
        }
      );
    }
  }

  onCloseTag(e) {
    const current_filter = this.state.filter_tags;
    const index = current_filter.indexOf(e);

    if (index > -1) {
      current_filter.splice(index, 1);

      this.setState(
        {
          ...this.state,
          filter_tags: current_filter,
        },
        () => {
          this.updateTagSelection();
        }
      );
    }
  }

  updateTagNumbers() {
    const current_tags = [];

    const is_something_selected = this.state.data.reduce((check, paper) => {
      check = check || paper.selected;
      return check;
    }, false);

    this.state.data.forEach(paper => {
      paper.tags.forEach(t => {
        const tag = t.name;

        if (paper.selected || !is_something_selected) {
          if (Object.keys(current_tags).indexOf(tag) > -1) {
            current_tags[tag] = current_tags[tag] + 1;
          } else {
            if (tag) current_tags[tag] = 1;
          }
        } else {
          if (Object.keys(current_tags).indexOf(tag) > -1) {
            current_tags[tag] = current_tags[tag] - 1;

            if (!current_tags[tag]) delete current_tags[tag];
          }
        }
      });
    });

    this.setState({
      ...this.state,
      selected_tags: current_tags,
    });
  }

  objectSort(object) {
    var sortable = [];
    for (var obj in object) {
      sortable.push([obj, object[obj]]);
    }

    sortable.sort(function(a, b) {
      return b[1] - a[1];
    });

    return sortable.map(e => e[0]);
  }

  render() {
    return (
      <>
        {this.objectSort(this.state.selected_tags).map((tag, i) => (
          <Tag
            filter={this.state.filter_tags.indexOf(tag) > -1}
            onClose={this.onCloseTag.bind(this, tag)}
            onClick={this.onClickTag.bind(this, tag)}
            key={i}
            type={this.determineTagColor(tag)}
            size={this.determineTagSize(tag)}>
            {tag}
          </Tag>
        ))}
      </>
    );
  }
}

export {
  generateURL,
  shuffleArray,
  hashID,
  unhashID,
  getParents,
  getChildren,
  PaperInner,
  Paper,
  TagArea,
  Simulate,
};
