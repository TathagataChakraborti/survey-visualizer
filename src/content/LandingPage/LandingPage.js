import React from 'react';
import GitHubButton from 'react-github-btn';
import { Document, LogoGithub, LogoSlack, Add } from '@carbon/icons-react';
import { BasicElement } from '../../components/BasicElement';
import {
  Grid,
  Column,
  Button,
  ButtonSet,
  ContentSwitcher,
  Switch,
  CodeSnippet,
  Link,
  Tile,
  ContainedList,
  ContainedListItem,
} from '@carbon/react';

let config = require('../../config.json');

class LandingPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: config.default_view,
    };
  }

  logChange = e => {
    this.setState({
      view: e.name,
    });
  };

  render() {
    return (
      <>
        <Grid>
          <Column lg={4} md={8} sm={4}>
            <div className="bx--container">
              <ContentSwitcher
                onChange={e => this.logChange(e)}
                size="sm"
                selectedIndex={config['views']
                  .map(e => e.name)
                  .indexOf(this.state.view)}>
                {config['views'].map((view, id) => (
                  <Switch key={id} name={view['name']} text={view['name']} />
                ))}
              </ContentSwitcher>

              <br />
              <br />

              <h3>{config['metadata']['title_text']}</h3>

              <br />
              <CodeSnippet type="multi">
                {config['metadata']['citation_text']}
              </CodeSnippet>

              <br />

              <ButtonSet stacked>
                <Button
                  kind="primary"
                  className="buttonset"
                  size="sm"
                  renderIcon={Document}
                  href={config['metadata']['primary_link']}
                  target="_blank">
                  Read
                </Button>
                <br />
                {config['metadata']['secondary_links'].length === 1 && (
                  <>
                    <Button
                      kind="tertiary"
                      className="buttonset"
                      size="sm"
                      renderIcon={Document}
                      href={config['metadata']['secondary_links'][0]['link']}
                      target="_blank">
                      See Also
                    </Button>
                    <br />
                  </>
                )}
                <Button
                  kind="tertiary"
                  className="buttonset tertiary-secondary"
                  renderIcon={LogoGithub}
                  size="sm"
                  href={config['metadata']['link_to_contribute']}
                  target="_blank">
                  Contribute
                </Button>
                <br />
                {config['metadata']['community_link'] && (
                  <>
                    <Button
                      kind="tertiary"
                      className="buttonset tertiary-danger"
                      renderIcon={LogoSlack}
                      size="sm"
                      href={config['metadata']['community_link']}
                      target="_blank">
                      Community
                    </Button>
                    <br />
                  </>
                )}
              </ButtonSet>

              {config['metadata']['info_tile'] && (
                <Tile>
                  <p style={{ fontSize: 'small' }}>
                    {config['metadata']['info_text']}
                  </p>

                  <div style={{ paddingTop: '3px' }}>
                    {config['metadata']['info_link'].map((link, id) => (
                      <span key={id}>
                        {' '}
                        {id > 0 && '|'}{' '}
                        <Link href={link.link} target="_blank">
                          {link.text}
                        </Link>
                      </span>
                    ))}
                  </div>
                </Tile>
              )}

              <br />

              {config['metadata']['secondary_links'].length > 1 && (
                <ContainedList
                  size="sm"
                  label="See Also"
                  kind="disclosed"
                  className="see-also">
                  {config['metadata']['secondary_links'].map((item, i) => (
                    <ContainedListItem
                      onClick={() => window.open(item.link)}
                      action={
                        <Button
                          href={item.link}
                          target="_blank"
                          kind="ghost"
                          iconDescription="URL"
                          hasIconOnly
                          renderIcon={Add}
                        />
                      }
                      key={i}>
                      {item.name}
                    </ContainedListItem>
                  ))}
                </ContainedList>
              )}
            </div>

            <div className="footer">
              <div className="bx--container">
                <p
                  style={{
                    fontSize: 'small',
                    marginBottom: '10px',
                    maxWidth: '75%',
                  }}>
                  Follow us on GitHub. Your love keeps us going!{' '}
                  <span role="img" aria-label="hugging face">
                    &#129303;
                  </span>
                </p>

                <GitHubButton
                  href={config.metadata.link_to_code}
                  data-size="small"
                  data-show-count="true"
                  aria-label="Star survey-visualizer on GitHub">
                  Star
                </GitHubButton>
              </div>

              <div className="bx--container" style={{ paddingTop: '0' }}>
                App built by{' '}
                <Link href="https://twitter.com/tchakra2" target="_blank">
                  tchakra2
                </Link>
              </div>
            </div>
          </Column>

          <Column lg={12} md={8} sm={4}>
            <BasicElement
              props={this.state.view}
              logChange={this.logChange.bind(this)}
            />
          </Column>
        </Grid>
      </>
    );
  }
}

export default LandingPage;
