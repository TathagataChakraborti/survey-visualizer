import React from 'react';
import { CaretUp32, CaretDown32 } from '@carbon/icons-react';
import {
  Search,
  ToastNotification,
  NumberInput,
  Button,
} from 'carbon-components-react';
import { Paper, hashID } from '../../components/Info';

import { Affinity } from '../Affinity';
import { Network } from '../Network';
import { Taxonomy } from '../Taxonomy';

const components = {
  Taxonomy: Taxonomy,
  Network: Network,
  Affinity: Affinity,
};

let config = require('../../config.json');
let current_year = new Date().getFullYear();

class BasicElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      taxonomy_data: [],
      paper_data: [],
      active_view: props.props,
      config: config,
      search: '',
      tags: [],
      number: 0,
      years: {
        min_min: 1984,
        min_val: config.min_year,
        max_max: current_year,
        max_val: current_year,
        cur_val: current_year,
      },
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.props !== prevProps.props)
      this.setState({
        ...this.state,
        active_view: this.props.props,
        search: '',
        tags: [],
      });
  }

  handleSimulate(e) {
    this.setState(
      {
        ...this.state,
        years: {
          ...this.state.years,
          cur_val: e,
        },
      },
      () => {
        this.refreshData();
      }
    );
  }

  refreshData = e => {
    var updated_paper_list = this.state.cached_paper_data
      .filter(
        item =>
          this.state.tags.filter(tag =>
            new Set(item.tags.map(e => hashID(e))).has(hashID(tag))
          ).length > 0 || this.state.tags.length === 0
      )
      .filter(item => {
        if (!this.state.search) return true;

        var search_phrase = this.state.search.trim().toLowerCase();
        var search_list = search_phrase.split('||');
        var meta_data = [
          item.title,
          item.authors,
          item.venue,
          item.year,
          item.abstract,
        ]
          .join(' ')
          .toLowerCase()
          .replaceAll(',', ' ')
          .replaceAll('.', ' ');

        var meta_data_set = new Set(meta_data.split(/\s+/));

        var is_true = search_list.reduce((is_true, s) => {
          var search_keywords_list = s
            .trim()
            .split(/\s+/)
            .map(e => {
              return e.trim();
            });

          if (s)
            is_true =
              is_true ||
              meta_data.indexOf(s) > -1 ||
              search_keywords_list.filter(search_keyword =>
                meta_data_set.has(search_keyword)
              ).length === search_keywords_list.length;

          return is_true;
        }, false);

        return is_true;
      })
      .filter(
        item =>
          parseInt(item.year) >= this.state.years.min_val &&
          parseInt(item.year) <= this.state.years.max_val &&
          parseInt(item.year) <= this.state.years.cur_val
      );

    var number = updated_paper_list.length;

    this.setState({
      ...this.state,
      paper_data: updated_paper_list.map(e => {
        e.selected = true;
        return e;
      }),
      number: number,
    });
  };

  updateSelectedTab = (paper_data, taxonomy_data) => {
    const min_year = paper_data.reduce((min_year, paper) => {
      if (paper.year < min_year) min_year = paper.year;

      return min_year;
    }, this.state.years.max_max);

    const max_year = paper_data.reduce((max_year, paper) => {
      if (paper.year > max_year) max_year = paper.year;

      return max_year;
    }, this.state.years.min_min);

    this.setState({
      ...this.state,
      taxonomy_data: taxonomy_data,
      paper_data: paper_data,
      cached_paper_data: paper_data,
      search: '',
      tags: [],
      number: paper_data.length,
      years: {
        ...this.state.years,
        min_min: min_year,
        max_max: max_year,
        min_val: min_year,
        max_val: max_year,
      },
    });
  };

  updateSelectedTags = tag => {
    var current_tags = this.state.tags;
    var index_of_tag = current_tags.map(e => hashID(e)).indexOf(hashID(tag));

    if (index_of_tag > -1) {
      current_tags.splice(index_of_tag, 1);
    } else {
      current_tags.push(tag);
    }

    this.setState(
      {
        ...this.state,
        tags: current_tags,
      },
      () => {
        this.refreshData();
      }
    );
  };

  handleInputChange = e => {
    this.setState(
      {
        search: e.target.value,
      },
      () => {
        this.refreshData();
      }
    );
  };

  sortYear = e => {
    var mode_selector = e.currentTarget.name === 'decreasing' ? -1 : 1;
    var new_paper_data = this.state.paper_data;

    new_paper_data.sort(function(a, b) {
      return a.year <= b.year ? -1 * mode_selector : 1 * mode_selector;
    });

    this.setState({
      ...this.state,
      paper_data: new_paper_data,
    });
  };

  render() {
    return (
      <div className="bx--container">
        <div className="bx--row">
          <div className="bx--col-lg-10">
            <Search
              light
              labelText=""
              id="search"
              placeholder="Search"
              size="sm"
              value={this.state.search}
              onChange={this.handleInputChange.bind(this)}
            />
            <div className="label-text" style={{ paddingTop: '5px' }}>
              The search is case insensitive and looks for an AND of all
              keywords. Use an "||" for OR semantics.
            </div>
          </div>

          <div className="bx--col-lg-3">
            <NumberInput
              light
              onChange={e => {
                this.setState(
                  {
                    ...this.state,
                    years: {
                      ...this.state.years,
                      min_val: parseInt(e.imaginaryTarget.value),
                    },
                  },
                  () => {
                    this.refreshData();
                  }
                );
              }}
              size="sm"
              id="min-year"
              min={this.state.years.min_min}
              max={this.state.years.max_val}
              value={this.state.years.min_val}
              helperText={<div className="label-text">Earliest date</div>}
              invalidText="Invalid"
            />
          </div>

          <div className="bx--col-lg-3">
            <NumberInput
              light
              onChange={e => {
                this.setState(
                  {
                    ...this.state,
                    years: {
                      ...this.state.years,
                      max_val: parseInt(e.imaginaryTarget.value),
                    },
                  },
                  () => {
                    this.refreshData();
                  }
                );
              }}
              size="sm"
              id="max-year"
              min={this.state.years.min_val}
              max={this.state.years.max_max}
              value={this.state.years.max_val}
              helperText={<div className="label-text">Latest date</div>}
              invalidText="Invalid"
            />
          </div>
        </div>

        <br />
        <br />

        <div className="bx--row">
          <div className="bx--col-lg-12">
            {this.state.config.views.map((view, id) => {
              if (this.state.active_view === view.name) {
                const Component = components[view.name];

                if (view.disabled) {
                  return (
                    <ToastNotification
                      lowContrast
                      hideCloseButton
                      key={id}
                      type="error"
                      subtitle={
                        <span>
                          The authors have disabled the {view.name} view. Please
                          check out the other viewing options on the left.
                        </span>
                      }
                      title="DISABLED"
                    />
                  );
                } else {
                  return (
                    <Component
                      props={this.state.paper_data}
                      updateSelectedTags={this.updateSelectedTags.bind(this)}
                      updateSelectedTab={this.updateSelectedTab.bind(this)}
                      handleSimulate={this.handleSimulate.bind(this)}
                      years={this.state.years}
                      key={id}
                    />
                  );
                }
              }

              return null;
            })}
          </div>
          <div className="bx--col-lg-4">
            <p>
              Showing all <span className="text-blue">{this.state.number}</span>{' '}
              papers
              {Boolean(this.state.search || this.state.tags.length > 0) && (
                <span> with </span>
              )}
              {this.state.tags.length > 0 && (
                <span className="text-blue">
                  selected tags{' '}
                  {this.state.tags
                    .map(item => item.parent + ':' + item.name)
                    .join(', ')}
                </span>
              )}
              {Boolean(this.state.search && this.state.tags.length) > 0 && (
                <span> and </span>
              )}
              {this.state.search && (
                <>
                  {' '}
                  one or more of keywords{' '}
                  <span className="text-blue">{this.state.search}</span> in
                  their metadata
                </>
              )}
              .
            </p>
            <br />

            <Button
              onClick={this.sortYear.bind(this)}
              name="decreasing"
              kind="ghost"
              className="navigation-buttons"
              renderIcon={CaretUp32}
              iconDescription="Sort down by year"
              size="sm"
              hasIconOnly
            />
            <Button
              onClick={this.sortYear.bind(this)}
              name="increasing"
              kind="ghost"
              className="navigation-buttons"
              renderIcon={CaretDown32}
              iconDescription="Sort up by year"
              size="sm"
              hasIconOnly
            />

            {this.state.paper_data.map((item, id) => (
              <Paper key={id} paper={item} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export { BasicElement };
