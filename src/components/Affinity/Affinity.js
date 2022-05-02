import React from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { InlineNotification, Link } from 'carbon-components-react';
import { PaperInner, Simulate, TagArea } from '../../components/Info';

import '@carbon/charts/styles.css';

let config = require('../../config.json');
let embeddings = require('../../compiler/data/Affinity.json');

let taxonomy_data = require('../../compiler/data/Taxonomy.json');
let paper_data = taxonomy_data.find(
  e => e.name === config.views.find(e => e.name === 'Taxonomy').default_tab
).data;

const ShapeNodeSize = 5;
const scaleBy = 1.01;
const fillFactor = 0.8;

class Affinity extends React.Component {
  constructor(props) {
    super(props);

    this.ref = React.createRef();
    this.stageRef = React.createRef();
    this.state = {
      data: paper_data,
      cached_data: paper_data,
      hoverText: null,
      annotations: [],
      newAnnotation: [],
      config: {
        is_draggable: true,
        stageHeight: 100,
        stageWidth: 100,
      },
      years: this.props.years,
    };

    this.updateSelectedTab();
  }

  componentDidMount(props) {
    const stageHeight = this.ref.current.offsetHeight;
    const stageWidth = this.ref.current.offsetWidth;

    const offsetX = Math.min(...embeddings.map(e => e.pos[0]));
    const maxX = Math.max(...embeddings.map(e => e.pos[0]));

    const offsetY = Math.min(...embeddings.map(e => e.pos[1]));
    const maxY = Math.max(...embeddings.map(e => e.pos[1]));

    let new_embeddings = embeddings.map(e => {
      var new_embedding = e;

      new_embedding.pos[0] =
        (fillFactor * stageWidth * (-offsetX + e.pos[0])) / (maxX - offsetX);
      new_embedding.pos[1] =
        (fillFactor * stageHeight * (-offsetY + e.pos[1])) / (maxY - offsetY);

      return new_embedding;
    });

    this.lastCenter = null;
    this.lastDist = 0;

    const new_paper_data = paper_data.map(item => {
      const embedding_item = new_embeddings.filter(e => e.UID === item.UID)[0];
      var new_item = item;

      new_item['x'] =
        5 * ShapeNodeSize + this.applyScalingX(1, embedding_item.pos[0]);
      new_item['y'] =
        5 * ShapeNodeSize + this.applyScalingY(1, embedding_item.pos[1]);

      new_item.selected = false;
      return new_item;
    });

    if (this.ref.current) {
      this.setState({
        ...this.state,
        data: new_paper_data,
        cached_data: new_paper_data,
        config: {
          ...this.state.config,
          stageHeight: this.ref.current.offsetHeight,
          stageWidth: this.ref.current.offsetWidth,
        },
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.props !== prevProps.props)
      this.setState({
        ...this.state,
        data: this.props.props,
        years: this.props.years,
      });
  }

  getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  getCenter(p1, p2) {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  applyScalingX(scale, x) {
    return scale * x;
  }

  applyScalingY(scale, y) {
    return scale * y;
  }

  handleMouseDown = e => {
    if (e.evt.shiftKey) {
      this.setState(
        {
          ...this.state,
          config: {
            ...this.state.config,
            is_draggable: false,
          },
        },
        () => {
          if (e.currentTarget.mouseClickEndShape === null) {
            const container = e.target.getStage().container();
            container.style.cursor = 'grab';

            const { x, y } = e.target.getStage().getPointerPosition();
            this.setState({
              ...this.state,
              annotations: [],
              newAnnotation: [{ x, y, width: 0, height: 0, key: '0' }],
            });
          }
        }
      );
    } else {
      this.setState({
        ...this.state,
        config: {
          ...this.state.config,
          is_draggable: true,
        },
      });
    }
  };

  handleMouseUp = e => {
    const container = e.target.getStage().container();
    container.style.cursor = '';

    if (this.state.newAnnotation.length) {
      const sx = this.state.newAnnotation[0].x;
      const sy = this.state.newAnnotation[0].y;
      const { x, y } = e.target.getStage().getPointerPosition();

      this.setState({
        ...this.state,
        annotations: [],
        newAnnotation: [],
      });

      const new_paper_data = this.state.cached_data.map(paper => {
        var selected = false;

        if (x > sx) {
          selected = paper.x > sx && paper.x < x;
        } else {
          selected = paper.x < sx && paper.x > x;
        }

        if (y > sy) {
          selected = selected && paper.y > sy && paper.y < y;
        } else {
          selected = selected && paper.y < sy && paper.y > y;
        }

        return {
          ...paper,
          selected: selected,
        };
      });

      var new_selection = new_paper_data.filter(e => e.selected);

      if (new_selection.length) {
        this.setState(
          {
            ...this.state,
            data: new_paper_data.filter(e => e.selected),
            cached_data: new_paper_data,
          },
          () => {
            this.updateSelectedTab();
          }
        );
      }
    }
  };

  handleMouseMove = e => {
    if (this.state.newAnnotation.length) {
      const sx = this.state.newAnnotation[0].x;
      const sy = this.state.newAnnotation[0].y;
      const { x, y } = e.target.getStage().getPointerPosition();

      const annotationToAdd = {
        x: sx,
        y: sy,
        width: x - sx,
        height: y - sy,
        key: '0',
      };

      this.setState({
        ...this.state,
        annotations: [annotationToAdd],
        newAnnotation: [annotationToAdd],
      });
    }
  };

  updateSelectedTab(e) {
    this.props.updateSelectedTab(this.state.data, []);
  }

  onNodeHover(uid, e) {
    const paper_data = this.state.cached_data.find(e => e.UID === uid);
    const container = e.target.getStage().container();

    if (!this.state.newAnnotation.length) container.style.cursor = 'pointer';

    this.setState({
      ...this.state,
      hoverText: <PaperInner paper={paper_data} />,
    });
  }

  offNodeHover(e) {
    const container = e.target.getStage().container();
    if (!this.state.newAnnotation.length) container.style.cursor = '';

    this.setState({
      ...this.state,
      hoverText: null,
    });
  }

  updateTagSelection(filter_tags) {
    const paper_data = this.state.cached_data.filter(
      paper =>
        filter_tags.filter(tag => new Set(paper.tags.map(t => t.name)).has(tag))
          .length > 0 || filter_tags.length === 0
    );

    this.setState(
      {
        ...this.state,
        data: paper_data,
      },
      () => {
        this.updateSelectedTab();
      }
    );
  }

  selectNode(uid) {
    const new_paper_data = this.state.cached_data.map(paper => {
      if (paper.UID === uid) paper.selected = !paper.selected;
      return paper;
    });

    const is_something_selected = this.state.data.reduce((check, paper) => {
      check = check || paper.selected;
      return check;
    }, false);

    if (!is_something_selected) {
      this.setState(
        {
          ...this.state,
          data: this.state.cached_data,
        },
        () => {
          this.updateSelectedTab();
        }
      );
    } else {
      this.setState(
        {
          ...this.state,
          data: new_paper_data.filter(e => e.selected),
        },
        () => {
          this.updateSelectedTab();
        }
      );
    }
  }

  zoomStage(event) {
    event.evt.preventDefault();
    if (this.stageRef.current) {
      const stage = this.stageRef.current;
      const oldScale = stage.scaleX();
      const { x: pointerX, y: pointerY } = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointerX - stage.x()) / oldScale,
        y: (pointerY - stage.y()) / oldScale,
      };
      const newScale =
        event.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      stage.scale({ x: newScale, y: newScale });
      const newPos = {
        x: pointerX - mousePointTo.x * newScale,
        y: pointerY - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    }
  }

  handleTouch(e) {
    e.evt.preventDefault();
    var touch1 = e.evt.touches[0];
    var touch2 = e.evt.touches[1];
    const stage = this.stageRef.current;
    if (stage !== null) {
      if (touch1 && touch2) {
        if (stage.isDragging()) {
          stage.stopDrag();
        }

        var p1 = {
          x: touch1.clientX,
          y: touch1.clientY,
        };
        var p2 = {
          x: touch2.clientX,
          y: touch2.clientY,
        };

        if (!this.lastCenter) {
          this.lastCenter = this.getCenter(p1, p2);
          return;
        }
        var newCenter = this.getCenter(p1, p2);

        var dist = this.getDistance(p1, p2);

        if (!this.lastDist) {
          this.lastDist = dist;
        }

        // local coordinates of center point
        var pointTo = {
          x: (newCenter.x - stage.x()) / stage.scaleX(),
          y: (newCenter.y - stage.y()) / stage.scaleX(),
        };

        var scale = stage.scaleX() * (dist / this.lastDist);

        stage.scaleX(scale);
        stage.scaleY(scale);

        // calculate new position of the stage
        var dx = newCenter.x - this.lastCenter.x;
        var dy = newCenter.y - this.lastCenter.y;

        var newPos = {
          x: newCenter.x - pointTo.x * scale + dx,
          y: newCenter.y - pointTo.y * scale + dy,
        };

        stage.position(newPos);
        stage.batchDraw();

        this.lastDist = dist;
        this.lastCenter = newCenter;
      }
    }
  }

  handleTouchEnd() {
    this.lastCenter = null;
    this.lastDist = 0;
  }

  mouseUpGlobal(e) {
    this.setState({
      ...this.state,
      slide_on: false,
    });
  }

  handleSimulate(e) {
    this.setState(
      {
        ...this.state,
        slide_on: true,
      },
      () => {
        this.props.handleSimulate(e);
      }
    );
  }

  render() {
    return (
      <div onMouseUp={this.mouseUpGlobal.bind(this)}>
        <InlineNotification
          subtitle={
            <span>
              This view into document similarity space was inspired from{' '}
              <Link
                href="https://github.com/Mini-Conf/Mini-Conf"
                target="_blank">
                Miniconf
              </Link>
              . Each dot is a paper. If you <b>hover</b> over a dot, you see the
              corresponding paper. To learn more about an area of the plot,{' '}
              <b>Select</b> one or more papers by clicking on the dots or by
              pressing SHIFT and dragging a rectangle over them.
            </span>
          }
          title="Document Embeddings"
          kind="info"
          lowContrast
        />

        <div className="bx--container">
          <div className="bx--row">
            <Simulate
              data={this.state.data}
              years={this.state.years}
              handleSimulate={this.handleSimulate.bind(this)}
              slide_on={this.state.slide_on}
            />

            <div
              className={
                'bx--col-lg-6 ' + (this.state.slide_on && ' display_none')
              }
              style={{ height: '75px' }}>
              <span>{this.state.hoverText}</span>
            </div>
          </div>
        </div>

        <div
          className="bx--col-lg-16"
          style={{ height: '40vh' }}
          ref={this.ref}>
          <Stage
            onMouseDown={this.handleMouseDown}
            onMouseUp={this.handleMouseUp}
            onMouseMove={this.handleMouseMove}
            width={this.state.config.stageWidth}
            height={this.state.config.stageHeight}
            draggable={this.state.config.is_draggable}
            onWheel={this.zoomStage.bind(this)}
            onTouchMove={this.handleTouch.bind(this)}
            onTouchEnd={this.handleTouchEnd.bind(this)}
            ref={this.stageRef}>
            <Layer>
              {this.state.annotations.map((value, id) => {
                return (
                  <Rect
                    key={id}
                    x={value.x}
                    y={value.y}
                    width={value.width}
                    height={value.height}
                    fill="#0f62fe"
                    opacity={0.7}
                  />
                );
              })}

              {this.state.cached_data.map(paper => (
                <Circle
                  key={paper.UID}
                  x={paper.x}
                  y={paper.y}
                  radius={ShapeNodeSize}
                  fill="#e4e4e4"
                  onMouseDown={this.selectNode.bind(this, paper.UID)}
                  onMouseEnter={this.onNodeHover.bind(this, paper.UID)}
                  onMouseLeave={this.offNodeHover.bind(this)}
                />
              ))}

              {this.state.data.map(paper => (
                <Circle
                  key={paper.UID}
                  x={paper.x}
                  y={paper.y}
                  radius={ShapeNodeSize}
                  fill={paper.selected ? '#0f62fe' : '#d2e6ff'}
                  onMouseDown={this.selectNode.bind(this, paper.UID)}
                  onMouseEnter={this.onNodeHover.bind(this, paper.UID)}
                  onMouseLeave={this.offNodeHover.bind(this)}
                />
              ))}
            </Layer>
          </Stage>
        </div>

        <div className="bx--container">
          <div className="bx--row">
            <div className="bx--col-lg-12">
              <TagArea
                data={this.state.data}
                updateTagSelection={this.updateTagSelection.bind(this)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { Affinity };
