import React, {Fragment} from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider, responsiveFontSizes} from '@material-ui/core/styles';
import {dark_theme, light_theme} from './utils/Theme';

// PAGES
import Unknown from './pages/Unknown'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import BuyOrder from './pages/BuyOrder'
import Position from './pages/Position'
import Order from './pages/Order'
import Market from './pages/Market'
import Model from './pages/Model'
import History from './pages/History'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
// COMPONENTS
import Menu from './components/Menu'
import Toast from './components/Toast'
import {get, post, put} from './utils/Api'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      message_type: null,
      opacity: 0,
      theme: localStorage.getItem('theme'),
      logged_in: localStorage.getItem('token') ? true : false,
      user: JSON.parse(localStorage.getItem('user')),
      portfolio_type: localStorage.getItem('portfolio_type') === 'true',
      errors: {},
      p_demo: JSON.parse(localStorage.getItem('p_demo')),
      p_real: JSON.parse(localStorage.getItem('p_real')),
      loading: false
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handlePortfolioChange = () => {
    localStorage.setItem('portfolio_type', !this.state.portfolio_type)
    this.setState({portfolio_type: !this.state.portfolio_type})
  }

  handleThemeChange = () => {
    if (this.state.theme === 'light'){
      localStorage.setItem('theme', 'dark')
      this.setState({ theme: 'dark' });
    } else {
      localStorage.setItem('theme', 'light')
      this.setState({ theme: 'light' });
    }    
  }

  retrieveHome = () => {
    console.log('retrieveHome')
    this.setState({loading:true})
    get('api/home/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({
          p_demo: response.p_demo,
          p_real: response.p_real,
          loading: false
        })
        localStorage.setItem('p_demo', JSON.stringify(response.p_demo))
        localStorage.setItem('p_real', JSON.stringify(response.p_real))
      }
      if (resp.status === 401){
        console.log('Unauthorized')
        this.logout()
      }
    })
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
    console.log('update_user')
    this.setState({errors: {}})
    console.log(params)
    put('api/user/', params).then((resp) => {
      console.log(resp)
      var response = JSON.parse(resp.response)
        if(resp.status === 201){
          localStorage.setItem('user', JSON.stringify(response.user))
          this.setState({user: response.user})
          this.display_toast('Account updated!', 'success')
        } else {
            var errors = this.state.errors
            for (const err in response) {
              errors[err] = response[err]
            }
            this.setState({errors: errors})
        }
    })
  }

  update_portfolio = async (params) => {
    console.log('update_portfolio')
    this.setState({errors: {}})
    console.log(params)
    put('api/portfolio/', params).then((resp) => {
      var response = JSON.parse(resp.response)
      console.log(response.portfolio)
        if(resp.status === 201){
          if (response.portfolio.portfolio_type === true){
            var p_real = this.state.p_real
            p_real['portfolio'] = response.portfolio
            localStorage.setItem('p_real', JSON.stringify(p_real))
            this.setState({p_real: p_real})
          } else {
            var p_demo = this.state.p_demo
            p_demo['portfolio'] = response.portfolio
            localStorage.setItem('p_demo', JSON.stringify(p_demo))
            this.setState({p_demo: p_demo})
          }
          this.display_toast('Portfolio updated!', 'success')
        } else {
            var errors = this.state.errors
            for (const err in response) {
              errors[err] = response[err]
            }
            this.setState({errors: errors})
        }
    })
  }


  display_toast = async (message, type) => {
    this.setState({opacity: 1, message: message, message_type: type}, () => setTimeout(() => this.setState({opacity:0}),4000)); 
  }

  render() {
      return (
        <ThemeProvider theme={this.state.theme === 'light' ? responsiveFontSizes(light_theme) : responsiveFontSizes(dark_theme)}>
          <Router>
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
                    <Menu handleThemeChange={() => {this.handleThemeChange()}} handlePortfolioChange={() => {this.handlePortfolioChange()}} portfolio_type={this.state.portfolio_type}/>
                    {this.state.message !== null && <Toast type={this.state.message_type} message={this.state.message} opacity={this.state.opacity} />}
                    <Switch>
                      <Route exact={true} path="/" render={(props) => <Home {...props} retrieve_home={()=>{this.retrieveHome()}} loading={this.state.loading} p_demo={this.state.p_demo} p_real={this.state.p_real} user={this.state.user} portfolio_type={this.state.portfolio_type} logout={() => {this.logout()}}/>} />
                      <Route path="/portfolio" render={(props) => <Portfolio {...props} portfolio_type={this.state.portfolio_type}/>} />
                      <Route path="/position" render={(props) => <Position {...props} portfolio_type={this.state.portfolio_type}/>} />
                      <Route path="/buy_order" render={(props) => <BuyOrder {...props} portfolio_type={this.state.portfolio_type}/>} />
                      <Route path="/order" render={(props) => <Order {...props} portfolio_type={this.state.portfolio_type}/>} />
                      <Route path="/history" render={(props) => <History {...props} portfolio_type={this.state.portfolio_type}/>} />
                      <Route path="/market" render={(props) => <Market {...props} user={this.state.user} portfolio_type={this.state.portfolio_type} p_demo={this.state.p_demo} p_real={this.state.p_real} /> } />
                      <Route path="/model" render={(props) => <Model {...props} user={this.state.user}/> } />
                      <Route path="/profile" render={(props) => 
                        <Profile {...props} user={this.state.user} p_demo={this.state.p_demo} p_real={this.state.p_real} update_user={(params) => {this.update_user(params)}} 
                                  logout={() => {this.logout()}} handleChange={(e) => {this.handleChange(e)}} errors={this.state.errors}
                                  update_portfolio={(params) => {this.update_portfolio(params)}} /> }
                      />
                      <Route path="/404" render={(props) => <Unknown {...props} />} />
                      <Redirect to="/404" />
                    </Switch>
                  </Fragment>
                }
              </Switch>
              
          </Router>
          </ThemeProvider>
      ); 
  }
}

export default App





