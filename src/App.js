import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect, useHistory } from "react-router-dom";
import {post, get} from './utils/Api'
// PAGES
import _404 from './pages/_404'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Model from './pages/Model'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
// COMPONENTS
import Menu from './components/Menu'
import { Box, Container } from '@material-ui/core';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      logged_in: localStorage.getItem('access') ? true : false,
      user: JSON.parse(localStorage.getItem('user')),
      errors: {}
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  login = async () => {
    post('api/token/', this.state).then((resp) => {
      console.log(resp)
        if(resp.access !== undefined){
            console.log(resp)
            localStorage.setItem('access', resp.access)
            localStorage.setItem('refresh', resp.refresh)
            this.getCurrentUser()
            this.setState({logged_in: true})
        } else {
            var errors = this.state.errors
            for (const err in resp.response) {
              errors[err] = resp.response[err]
            }
            this.setState({errors: errors})
        }
    })
  }

  getCurrentUser = async () => {
    await get('api/current_user').then((resp) => {
      console.log(resp)
      localStorage.setItem('user', JSON.stringify(resp))
      this.setState({user: JSON.parse(localStorage.getItem('user'))})
    })
  }

  logout = async () => {
    localStorage.clear()
    this.setState({logged_in: false, user: {}, errors:{}})
  }

  render() {
      return (
          <Router>
              <Switch>
                {!this.state.logged_in &&
                <div>
                  <Route exact path='/' render={(props) => <Auth {...props} login={() => {this.login()}} handleChange={(e) => {this.handleChange(e)}} errors={this.state.errors}/>} />
                  <Redirect from='*' to='/' />
                </div>
                }
                {this.state.logged_in &&
                <div style={{backgroundColor: '#CFD8DC', minHeight: '100vh'}}>
                  <Menu logout={() => {this.logout()}}/>
                  <Container style={{minHeight: 'calc(100vh - 84px)', backgroundColor:'#CFD8DC'}}>
                    <Route exact path="/" render={(props) => <Home {...props} user={this.state.user}/>}/>
                    <Route exact path="/portfolio" render={(props) => <Portfolio {...props}/>} />
                    <Route exact path="/model" render={(props) => <Model {...props} user={this.state.user}/> } />
                    <Route exact path="/profile" render={(props) => <Profile {...props} user={this.state.user}/>} />
                    <Route exact path='/404' render={(props) => <_404 {...props} />} />
                  </Container>
                </div>
                }
              </Switch>
          </Router>
      ); 
  }
}

export default App





