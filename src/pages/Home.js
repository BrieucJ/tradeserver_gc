import React from 'react';
import { Container, Grid, Typography, CircularProgress, Paper} from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';
import Area_Chart from '../components/AreaChart'
import PortfolioTable from '../components/PortfolioTable'
import BuyOrderTable from '../components/BuyOrderTable'
import SellOrderTable from '../components/SellOrderTable'

const styles = {

}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading:true,
      g_height: 0 ,
      g_width: 0 ,
      last_price_date: null,
      last_order_date: null,
      last_portfolio_date: null,
      last_submited_order_date: null,
      p_demo: {},
      p_real: {}
    };
    this.graphRef = React.createRef();
  }

  componentDidMount = () => {
    console.log(this.props)
    window.addEventListener("resize", this.updateGraph);
    this.setState({loading:true})
    this.retrieveHome()
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateGraph);
  }
 
  componentDidUpdate() {
    if (this.state.g_height === 0){
      this.updateGraph();
    } 
  }

  updateGraph = () => {
    if (this.graphRef.current !== null){
      if (this.state.g_height !== this.graphRef.current.clientHeight) {
        this.setState({g_height: this.graphRef.current.clientHeight})
      }
      if (this.state.g_width !== this.graphRef.current.clientWidth) {
        this.setState({g_width: this.graphRef.current.clientWidth})
      }
    }
  }

  retrieveHome = () => {
    get('api/home/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({
          p_demo: response.p_demo,
          p_real: response.p_real,
          loading: false
        })
      }
      if (resp.status === 401){
        console.log('Unauthorized')
        this.props.logout()
      }
    })
  }

  pie_chart_data = () => {
    var data = []
    if (this.props.portfolio_type) {
      if (this.state.p_real.current_positions !== undefined){
        for (let i = 0; i < this.state.p_real.current_positions.length; i++) {
          const value = this.state.p_real.current_positions[i].total_investment
          const name = `${this.state.p_real.current_positions[i].stock.symbol} | ${this.state.p_real.current_positions[i].stock.name.substring(0,10)}`
          const item = {'name': name, 'value': value}
          data.push(item)
        }
      }
    } else {
      if (this.state.p_demo.current_positions !== undefined){
        for (let i = 0; i < this.state.p_demo.current_positions.length; i++) {
          const value = this.state.p_demo.current_positions[i].total_investment
          const name = `${this.state.p_demo.current_positions[i].stock.symbol} | ${this.state.p_demo.current_positions[i].stock.name.substring(0,10)}`
          const item = {'name': name, 'value': value}
          data.push(item)
        }
      }
    }
    return data
  }

  area_chart_data = () => {
    var data = []
    if (this.props.portfolio_type) {
      if (this.state.p_real.p_history !== undefined){
        for (let i = 0; i < this.state.p_real.p_history.length; i++) {
          const cash = this.state.p_real.p_history[i].cash
          const total_invested_value = this.state.p_real.p_history[i].total_invested_value
          const name = new Date(this.state.p_real.p_history[i].created_at).toLocaleString({timeZoneName:'short'})
          const item = {'name': name, 'cash': cash, 'total_invested_value': total_invested_value}
          data.push(item)
        }
      }
    } else {
      if (this.state.p_demo.p_history !== undefined){
        for (let i = 0; i < this.state.p_demo.p_history.length; i++) {
          const cash = this.state.p_demo.p_history[i].cash
          const total_invested_value = this.state.p_demo.p_history[i].total_invested_value
          const name = this.state.p_demo.p_history[i].created_at.split('T')[0]
          const item = {'name': name, 'cash': cash, 'total_invested_value': total_invested_value}
          data.push(item)
        }
      }
    }
    return data
  }

  total_pl() {
    var pl = 0
    if (this.props.portfolio_type){
      var pos_real = this.state.p_real.current_positions
      for (let i = 0; i < pos_real.length; i++) {
        var po_pl_real = (pos_real[i].current_rate - pos_real[i].open_rate) * pos_real[i].num_of_shares
        pl += po_pl_real
      }
    } else {
      var pos_demo = this.state.p_demo.current_positions
      for (let i = 0; i < pos_demo.length; i++) {
        var po_pl_demo = (pos_demo[i].current_rate - pos_demo[i].open_rate) * pos_demo[i].num_of_shares
        pl += po_pl_demo
      }
    }
    return pl
  }

  total_cash = () => {
    if(this.props.portfolio_type){
      if (this.state.p_real.portfolio.created_at !== null){
        return this.state.p_real.portfolio.last_portfolio_history.cash
      } else{
        return null
      }
    }else{
      if (this.state.p_demo.portfolio.created_at !== null){
        return this.state.p_demo.portfolio.last_portfolio_history.cash
      } else{
        return null
      }
    }
  }

  total_investment = () => {
    if(this.props.portfolio_type){
      if (this.state.p_real.portfolio.created_at !== null){
        return this.state.p_real.portfolio.last_portfolio_history.total_invested_value
      } else{
        return null
      }
    } else {
      if (this.state.p_demo.portfolio.created_at !== null){
        return this.state.p_demo.portfolio.last_portfolio_history.total_invested_value
      } else{
        return null
      }
    }
  }

  performance_to_date(){
    if(this.props.portfolio_type) {
      if (this.state.p_real.p_history.length !== 0){
        var start_balance_real = this.state.p_real.p_history[0].cash + this.state.p_real.p_history[0].total_invested_value
        var last_balance_real = this.total_cash() + this.total_investment() + this.total_pl()
        return last_balance_real/start_balance_real-1
      } else {
        return undefined
      }
    } else {
      if (this.state.p_demo.p_history.length !== 0){
        var start_balance_demo = this.state.p_demo.p_history[0].cash + this.state.p_demo.p_history[0].total_invested_value
        var last_balance_demo = this.total_cash() + this.total_investment() + this.total_pl()
        return last_balance_demo/start_balance_demo-1
      } else {
        return undefined
      }

    }
  }

  annualized_performance = () => {
    if(this.props.portfolio_type) {
      if (this.state.p_real.portfolio.created_at !== null){
        var delta = Math.abs(new Date(this.state.p_real.portfolio.created_at) - new Date()) / 1000;
        var num_of_days_real = delta / 86400
        var perf_to_date_real = this.performance_to_date()
        var annualized_return_real = (1+perf_to_date_real)**(365/num_of_days_real)-1
        return annualized_return_real
      } else {
        return null
      }
    } else {
      if (this.state.p_demo.portfolio.demo !== null){
        var delta = Math.abs(new Date(this.state.p_demo.portfolio.created_at) - new Date()) / 1000;
        var num_of_days_demo = delta / 86400
        var perf_to_date_demo = this.performance_to_date()
        var annualized_return_demo = ((1+perf_to_date_demo)**(365/num_of_days_demo))-1
        return annualized_return_demo
      } else {
        return null
      }
    }
  }

  initial_balance = () => {
    if(this.props.portfolio_type) {
      if (this.state.p_real.p_history.length !== 0){
        return this.state.p_real.p_history[0].cash + this.state.p_real.p_history[0].total_invested_value
      } else {
        return null
      }
    } else {
      if (this.state.p_demo.p_history.length !== 0){
        return this.state.p_demo.p_history[0].cash + this.state.p_demo.p_history[0].total_invested_value
      } else {
        return null
      }
    }
  }

  render() {
    if (this.state.loading){
      return(<Grid container
        spacing={0}
        direction="column"
        alignItems="center"
        justify="center"
        style={{ minHeight: '100vh' }}> <CircularProgress color='primary' /></Grid>)
    } else {
      return (
        <Container>
          <Grid container direction="row" spacing={1}>
            <Grid item  xs={12} sm={6} >
              <Paper style={{padding:5, flexGrow: 1}}>
                <Typography variant='h5'>
                  Summary
                </Typography>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Portfolio type: </Typography>
                  <Typography variant='body1'> {this.props.portfolio_type ? 'REAL' : 'DEMO'} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Portfolio status: </Typography>
                  <Typography variant='body1' style={{color: this.props.portfolio_type ? this.props.user.real_live === 'False' ? 'red': 'green' : this.props.user.demo_live === 'False' ? 'red': 'green' }}> {this.props.portfolio_type ? this.props.user.real_live : this.props.user.demo_live} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Creation date: </Typography>
                  <Typography variant='body1'> {this.props.portfolio_type ? 
                    this.state.p_real.p_history[0] !== undefined ? new Date(this.state.p_real.p_history[0].created_at).toLocaleString({timeZoneName:'short'}) : null 
                  : this.state.p_real.p_history[0] !== undefined ? new Date(this.state.p_demo.p_history[0].created_at).toLocaleString({timeZoneName:'short'}) : null} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Last update: </Typography>
                  <Typography variant='body1'> {this.props.portfolio_type ? 
                    this.state.p_real.portfolio !== undefined ? new Date(this.state.p_real.portfolio.updated_at).toLocaleString({timeZoneName:'short'})  : null 
                  : this.state.p_real.portfolio !== undefined ? new Date(this.state.p_demo.portfolio.updated_at).toLocaleString({timeZoneName:'short'}) : null} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Currency: </Typography>
                  <Typography variant='body1'> {this.props.portfolio_type ? this.state.p_real.portfolio.currency : this.state.p_demo.portfolio.currency} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Initial balance: </Typography>
                  <Typography variant='body1'> {this.initial_balance() === null ? 'None' : (this.initial_balance()).toLocaleString(undefined, {maximumFractionDigits: 2 }) } </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Cash: </Typography>
                  <Typography variant='body1'> {this.total_cash() === null ? 'None' : this.total_cash().toLocaleString(undefined, {maximumFractionDigits: 2 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Investments: </Typography>
                  <Typography variant='body1'> {this.total_investment() === null ? 'None' : this.total_investment().toLocaleString(undefined, {maximumFractionDigits: 2 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Latent P&L: </Typography>
                  <Typography variant='body1' style={{color: this.total_pl() > 0 ? 'green' : 'red'}}>{this.total_pl() > 0 && '+'}{this.total_pl().toLocaleString(undefined, {maximumFractionDigits: 2 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Total balance: </Typography>
                  <Typography variant='body1'> {(this.total_pl() + this.total_cash() + this.total_investment()).toLocaleString(undefined, {maximumFractionDigits: 2 }) } </Typography>
                </Grid>
  
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Return to date: </Typography>
                  <Typography variant='body1' style={{color: this.performance_to_date() > 0 ? 'green' : 'red'}}> {this.performance_to_date() > 0 && '+'}{(this.performance_to_date()*100).toFixed(2)}% </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Annualized return: </Typography>
                  <Typography variant='body1' style={{color: this.annualized_performance() > 0 ? 'green' : 'red'}}> {(this.annualized_performance()*100).toFixed(2)}%</Typography>
                </Grid>
              </Paper>
            </Grid>

            <Grid item container xs={12} sm={6}  >
              <Paper style={{padding:5, flexGrow: 1, height: '300px'}} ref={this.graphRef} >
                <Typography variant='h5' style={{display: 'inline-block'}}> Cash/Investments evolution </Typography>
                <Area_Chart data={this.area_chart_data()} height={this.state.g_height} width={this.state.g_width}/>
              </Paper>
            </Grid>

            <PortfolioTable 
              {...this.props}
              portfolio={this.props.portfolio_type ? this.state.p_real : this.state.p_demo}
              retrieve_history_details={(id) => {this.retrieve_history_details(id)}}
            />

            <BuyOrderTable 
              {...this.props}
              portfolio={this.props.portfolio_type ? this.state.p_real : this.state.p_demo}
            /> 
            
            <SellOrderTable 
              portfolio={this.props.portfolio_type ? this.state.p_real : this.state.p_demo}
            /> 
            
            </Grid>
        </Container>
      ); 
    }
  }
}

export default withStyles(styles, { withTheme: true })(Home);