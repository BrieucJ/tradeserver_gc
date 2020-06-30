import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect, useHistory } from "react-router-dom";
import {post, get, put} from './utils/Api'
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
      logged_in: localStorage.getItem('token') ? true : false,
      user: JSON.parse(localStorage.getItem('user')),
      errors: {}
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  sign_up = async (params) => {
    this.setState({errors: {}})
    post('api/user/', params).then((resp) => {
      var response = JSON.parse(resp.response)
        if(resp.status === 201){
          localStorage.setItem('token', response.token)
          localStorage.setItem('user', JSON.stringify(response.user))
          this.setState({logged_in: true, user: response.user})
        } else {
            var errors = this.state.errors
            for (const err in response) {
              errors[err] = response[err]
            }
            this.setState({errors: errors})
        }
    })
  }

  log_in = async (params) => {
    this.setState({errors: {}})
    post('api/token-auth/', params).then((resp) => {
        let response = JSON.parse(resp.response)
        if(resp.status == 200){
            localStorage.setItem('token', response.token)
            localStorage.setItem('user', JSON.stringify(response.user))
            this.setState({logged_in: true, user: response.user})
        } else {
            var errors = this.state.errors
            for (const err in response) {
              errors[err] = response[err]
            }
            this.setState({errors: errors})
        }
    })
  }

  logout = async () => {
    localStorage.clear()
    this.setState({logged_in: false, user: {}, errors:{}})
  }

  update_user = async (params) => {
    this.setState({errors: {}})
    put('api/user/', params).then((resp) => {
      console.log(resp)
      var response = JSON.parse(resp.response)
        if(resp.status === 201){
          localStorage.setItem('user', JSON.stringify(response.user))
          this.setState({user: response.user})
        } else {
            var errors = this.state.errors
            for (const err in response) {
              errors[err] = response[err]
            }
            this.setState({errors: errors})
        }
    })
  }

  render() {
      return (
          <Router>
              <Switch>
                {!this.state.logged_in &&
                <div style={{backgroundColor: '#CFD8DC', minHeight: '100vh'}}>
                  <Route exact path='/' render={(props) => <Auth {...props} sign_up={(params) => {this.sign_up(params)}} log_in={(params) => {this.log_in(params)}} handleChange={(e) => {this.handleChange(e)}} errors={this.state.errors}/>} />
                  <Redirect from='*' to='/' />
                </div>
                }
                {this.state.logged_in &&
                <div style={{backgroundColor: '#CFD8DC', minHeight: '100vh'}}>
                  <Menu logout={() => {this.logout()}}/>
                  <Container style={{minHeight: 'calc(100vh - 84px)', backgroundColor:'#CFD8DC'}}>
                    <Route exact path="/" render={(props) => <Home {...props} user={this.state.user}/>}/>
                    <Route exact path="/portfolio" render={(props) => <Portfolio {...props}/>} />
                    <Route exact path="/model" render={(props) => <Model {...props} user={this.state.user} getCurrentUser={() => {this.getCurrentUser()}}/> } />
                    <Route exact path="/profile" render={(props) => <Profile {...props} user={this.state.user} update_user={(params) => {this.update_user(params)}} handleChange={(e) => {this.handleChange(e)}} errors={this.state.errors}/>} />
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





