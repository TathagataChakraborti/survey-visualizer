import React, { Component } from 'react';
import './app.scss';

import { Content } from '@carbon/react';
import { Route, Switch } from 'react-router-dom';

import LandingPage from './content/LandingPage';

class App extends Component {
    render() {
        return (
            <>
                <Content>
                    <Switch>
                        <Route exact path="/" component={LandingPage} />
                        <Route exact path="/home" component={LandingPage} />
                    </Switch>
                </Content>
            </>
        );
    }
}

export default App;
