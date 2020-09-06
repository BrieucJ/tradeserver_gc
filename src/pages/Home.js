import React from 'react';
import { Container, Grid, Typography, CircularProgress, Paper, FormControl,  Select, MenuItem} from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';
import HomeChart from '../components/HomeChart'
import PortfolioTable from '../components/PortfolioTable'
import BuyOrderTable from '../components/BuyOrderTable'
import SellOrderTable from '../components/SellOrderTable'

const styles = {

}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      graph_dd: false,
      graph_type: 'performance_pct',
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
          var perf = null
          var diff = null
          if (i === 0){
            const old_balance = this.state.p_real.portfolio.first_portfolio_history.cash + this.state.p_real.portfolio.first_portfolio_history.total_invested_value
            const current_balance = this.state.p_real.p_history[i].cash + this.state.p_real.p_history[i].total_invested_value
            perf = (current_balance/old_balance-1)*100
            diff = current_balance - old_balance
          } else {
            const old_balance = this.state.p_real.p_history[i-1].cash + this.state.p_real.p_history[i-1].total_invested_value
            const current_balance = this.state.p_real.p_history[i].cash + this.state.p_real.p_history[i].total_invested_value
            perf = (current_balance/old_balance-1)*100
            diff = current_balance - old_balance
          }
          const name = this.state.p_real.p_history[i].created_at.split('T')[0]
          const item = {'name': name, 'cash': cash, 'total_invested_value': total_invested_value, 'perf': perf, 'diff':diff}
          data.push(item)
        }
      }
    } else {
      if (this.state.p_demo.p_history !== undefined){
        for (let i = 0; i < this.state.p_demo.p_history.length; i++) {
          const cash = this.state.p_demo.p_history[i].cash
          const total_invested_value = this.state.p_demo.p_history[i].total_invested_value
          var perf = null
          var diff = null
          if (i === 0){
            const old_balance = this.state.p_demo.portfolio.first_portfolio_history.cash + this.state.p_demo.portfolio.first_portfolio_history.total_invested_value
            const current_balance = this.state.p_demo.p_history[i].cash + this.state.p_demo.p_history[i].total_invested_value
            perf = (current_balance/old_balance-1)*100
            diff = current_balance - old_balance
          } else {
            const old_balance = this.state.p_demo.p_history[i-1].cash + this.state.p_demo.p_history[i-1].total_invested_value
            const current_balance = this.state.p_demo.p_history[i].cash + this.state.p_demo.p_history[i].total_invested_value
            perf = (current_balance/old_balance-1)*100
            diff = current_balance - old_balance
          }
          const name = this.state.p_real.p_history[i].created_at.split('T')[0]
          const item = {'name': name, 'cash': cash, 'total_invested_value': total_invested_value, 'perf': perf, 'diff': diff}
          data.push(item)
        }
      }
    }
    console.log(data)
    return data
  }

  // max_drawdown = () => {
  //   var lowest_balance = null;
  //   var init_balance = this.initial_balance()
  //   if(this.props.portfolio_type) {
  //     this.state.p_real.p_history.forEach(element => {
  //       var bal = element['cash'] + element['total_invested_value']
  //       if (lowest_balance === null || bal < lowest_balance){
  //         lowest_balance = bal
  //       }
  //     });
  //   } else {
  //     this.state.p_demo.p_history.forEach(element => {
  //       var bal = element['cash'] + element['total_invested_value']
  //       if (lowest_balance === null || bal < lowest_balance){
  //         lowest_balance = bal
  //       }
  //     });
  //   }
  //   if (Math.round(lowest_balance - init_balance) === 0){
  //     return 0
  //   } else {
  //     return lowest_balance - init_balance
  //   }
  // }

  toggle_graph_dd = () => {
    this.setState({graph_dd: !this.state.graph_dd})
  }

  handle_graph_change = (e) => {
    this.setState({graph_type: e.target.value})
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
      if (this.state.p_demo.portfolio.created_at === null) {
        const initial_balance = this.props.portfolio_type ? this.state.p_real.portfolio.first_portfolio_history.cash + this.state.p_real.portfolio.first_portfolio_history.total_invested_value : this.state.p_demo.portfolio.first_portfolio_history.cash + this.state.p_demo.portfolio.first_portfolio_history.total_invested_value
        const cash = this.props.portfolio_type ? this.state.p_real.portfolio.last_portfolio_history.cash : this.state.p_demo.portfolio.last_portfolio_history.cash
        const total_investment = this.props.portfolio_type ? this.state.p_real.portfolio.last_portfolio_history.total_invested_value : this.state.p_demo.portfolio.last_portfolio_history.total_invested_value
        const latent_p_l = this.props.portfolio_type ? this.state.p_real.portfolio.last_portfolio_history.latent_p_l : this.state.p_demo.portfolio.last_portfolio_history.latent_p_l
        const current_balance = cash + total_investment
        const performance_to_date = current_balance/initial_balance-1
        const num_of_days = this.props.portfolio_type ? (Math.abs(new Date(this.state.p_real.portfolio.first_portfolio_history.created_at) - new Date(this.state.p_real.portfolio.last_portfolio_history.created_at)) / 1000) / 86400 : (Math.abs(new Date(this.state.p_demo.portfolio.first_portfolio_history.created_at) - new Date(this.state.p_demo.portfolio.last_portfolio_history.created_at)) / 1000) / 86400
        const annualized_performance = (1+performance_to_date)**(365/num_of_days)-1
      } else {
        const initial_balance = null
        const cash = null
        const total_investment = null
        const latent_p_l = null
        const current_balance = null
        const performance_to_date = null
        const num_of_days = null
        const annualized_performance = null
      }

      return (
        <Container>
          <Grid container direction="row" spacing={1}>
            <Grid item  xs={12} sm={6} >
              <Paper style={{padding:5, flexGrow: 1}}>
                <Typography variant='h6'>
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
                  <Typography variant='body1'> {this.props.portfolio_type && this.state.p_real.portfolio !== undefined  && this.state.p_demo.portfolio !== undefined ? 
                    this.state.p_real.portfolio.created_at !== null ? this.state.p_real.portfolio.created_at.split('T')[0] : null 
                  : this.state.p_demo.portfolio.created_at !== null ? this.state.p_demo.portfolio.created_at.split('T')[0] : null} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Last update: </Typography>
                  <Typography variant='body1'> {this.props.portfolio_type && this.state.p_real.portfolio !== undefined  && this.state.p_demo.portfolio !== undefined? 
                    this.state.p_real.portfolio.updated_at !== null ? new Date(this.state.p_real.portfolio.updated_at).toLocaleString({timeZoneName:'short'})  : null 
                  : this.state.p_demo.portfolio.updated_at !== null ? new Date(this.state.p_demo.portfolio.updated_at).toLocaleString({timeZoneName:'short'}) : null} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Currency: </Typography>
                  <Typography variant='body1'> {this.props.portfolio_type ? this.state.p_real.portfolio.currency : this.state.p_demo.portfolio.currency} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Initial balance: </Typography>
                  <Typography variant='body1'> {initial_balance.toLocaleString(undefined, {maximumFractionDigits: 0 }) } </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Cash: </Typography>
                  <Typography variant='body1'> {cash.toLocaleString(undefined, {maximumFractionDigits: 0 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Investments: </Typography>
                  <Typography variant='body1'> {total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Latent P&L: </Typography>
                  <Typography variant='body1' style={{color: latent_p_l > 0 ? 'green' : 'red'}}>{latent_p_l.toLocaleString(undefined, {maximumFractionDigits: 0 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Current balance: </Typography>
                  <Typography variant='body1'> {current_balance.toLocaleString(undefined, {maximumFractionDigits: 0 })} </Typography>
                </Grid>
                
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Return to date: </Typography>
                  <Typography variant='body1' style={{color: performance_to_date > 0 ? 'green' : 'red'}}> {performance_to_date > 0 && '+'}{(performance_to_date*100).toFixed(2)}% </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Days: </Typography>
                  <Typography variant='body1'> {num_of_days.toFixed(1)} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Annualized return: </Typography>
                  <Typography variant='body1' style={{color: annualized_performance > 0 ? 'green' : 'red'}}> {(annualized_performance*100).toFixed(2)}%</Typography>
                </Grid>
              </Paper>
            </Grid>

            <Grid item container xs={12} sm={6}  >
              <Paper style={{padding:5, flexGrow: 1, minHeight:300}} ref={this.graphRef} >
              <FormControl>
              
                <Select
                  disableUnderline
                  open={this.state.graph_dd}
                  onClose={() => {this.toggle_graph_dd()}}
                  onOpen={() => {this.toggle_graph_dd()}}
                  value={this.state.graph_type}
                  onChange={(e) => {this.handle_graph_change(e)}}
                >
                  
                  <MenuItem value='cash'>
                    <Typography variant='h6'>
                      Cash
                    </Typography>
                  </MenuItem>
                  
                  <MenuItem value='investments'>
                    <Typography variant='h6'>
                        Investments
                      </Typography>
                  </MenuItem>
                  <MenuItem value='cash_investments'>
                      <Typography variant='h6'>
                        Cash/Investments
                      </Typography>
                  </MenuItem>
                  <MenuItem value='performance_pct'>
                      <Typography variant='h6'>
                        Performance %
                      </Typography>
                  </MenuItem>
                  <MenuItem value='performance_curr'>
                      <Typography variant='h6'>
                        Performance $
                      </Typography>
                  </MenuItem>
                </Select>
              </FormControl>
                  <HomeChart
                    data={this.area_chart_data()}
                    height={this.state.g_height}
                    width={this.state.g_width}
                    graph_type={this.state.graph_type}
                  />
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
              {...this.props}
              portfolio={this.props.portfolio_type ? this.state.p_real : this.state.p_demo}
            /> 
            
            </Grid>
        </Container>
      ); 
    }
  }
}

export default withStyles(styles, { withTheme: true })(Home);