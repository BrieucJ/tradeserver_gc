import React, {Fragment} from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider, responsiveFontSizes} from '@material-ui/core/styles';
import {dark_theme, light_theme} from './utils/Theme';

// PAGES
import _404 from './pages/_404'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Market from './pages/Market'
import Model from './pages/Model'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
// COMPONENTS
import Menu from './components/Menu'
import {post, put} from './utils/Api'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: 'dark',
      logged_in: localStorage.getItem('token') ? true : false,
      user: JSON.parse(localStorage.getItem('user')),
      errors: {}
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleThemeChange = () => {
    if (this.state.theme === 'light'){
      this.setState({ theme: 'dark' });
    } else {
      this.setState({ theme: 'light' });
    }    
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
        if(resp.status === 200){
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
            <ThemeProvider theme={this.state.theme === 'light' ? responsiveFontSizes(light_theme) : responsiveFontSizes(dark_theme)}>
              <CssBaseline />
              <Switch>
                {!this.state.logged_in &&
                <Fragment>
                  <Route exact path='/' render={(props) => <Auth {...props} sign_up={(params) => {this.sign_up(params)}} log_in={(params) => {this.log_in(params)}} handleChange={(e) => {this.handleChange(e)}} errors={this.state.errors}/>} />
                  <Redirect from='*' to='/' />
                </Fragment>
                }
                {this.state.logged_in &&
                  <Fragment>
                    <Menu handleThemeChange={() => {this.handleThemeChange()}}/>
                    <Route exact path="/" render={(props) => <Home {...props} user={this.state.user}/>}/>
                    <Route exact path="/portfolio" render={(props) => <Portfolio {...props}/>} />
                    <Route exact path="/market" render={(props) => <Market {...props} user={this.state.user} getCurrentUser={() => {this.getCurrentUser()}}/> } />
                    <Route exact path="/model" render={(props) => <Model {...props} user={this.state.user} getCurrentUser={() => {this.getCurrentUser()}}/> } />
                    <Route exact path="/profile" render={(props) => <Profile {...props} user={this.state.user} update_user={(params) => {this.update_user(params)}} logout={() => {this.logout()}} handleChange={(e) => {this.handleChange(e)}} errors={this.state.errors}/>} />
                    <Route exact path='/404' render={(props) => <_404 {...props} />} />
                  </Fragment>
                }
              </Switch>
              </ThemeProvider>
          </Router>
      ); 
  }
}

export default App





