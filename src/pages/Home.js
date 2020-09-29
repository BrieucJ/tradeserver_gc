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
    };
    this.graphRef = React.createRef();
  }

  componentDidMount = () => {
    window.addEventListener("resize", this.updateGraph);
    this.props.retrieve_home()
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

  pie_chart_data = () => {
    var data = []
    if (this.props.portfolio_type) {
      if (this.props.p_real.current_positions !== undefined){
        for (let i = 0; i < this.props.p_real.current_positions.length; i++) {
          const value = this.props.p_real.current_positions[i].total_investment
          const name = `${this.props.p_real.current_positions[i].stock.symbol} | ${this.props.p_real.current_positions[i].stock.name.substring(0,10)}`
          const item = {'name': name, 'value': value}
          data.push(item)
        }
      }
    } else {
      if (this.props.p_demo.current_positions !== undefined){
        for (let i = 0; i < this.props.p_demo.current_positions.length; i++) {
          const value = this.props.p_demo.current_positions[i].total_investment
          const name = `${this.props.p_demo.current_positions[i].stock.symbol} | ${this.props.p_demo.current_positions[i].stock.name.substring(0,10)}`
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
      if (this.props.p_real != null && this.props.p_real.portfolio.history !== undefined){
        for (let i = 0; i < this.props.p_real.portfolio.history.length; i++) { 
          const cash = this.props.p_real.portfolio.history[i].cash
          const total_invested_value = this.props.p_real.portfolio.history[i].total_invested_value
          var perf = null
          var diff = null
          if (i === 0){
            const old_balance = this.props.p_real.portfolio.first_portfolio_history.cash + this.props.p_real.portfolio.first_portfolio_history.total_invested_value + this.props.p_real.portfolio.first_portfolio_history.latent_p_l
            const current_balance = this.props.p_real.portfolio.history[i].cash + this.props.p_real.portfolio.history[i].total_invested_value + this.props.p_real.portfolio.history[i].latent_p_l
            perf = (current_balance/old_balance-1)*100
            diff = current_balance - old_balance
          } else {
            const old_balance = this.props.p_real.portfolio.history[i-1].cash + this.props.p_real.portfolio.history[i-1].total_invested_value + this.props.p_real.portfolio.history[i-1].latent_p_l
            const current_balance = this.props.p_real.portfolio.history[i].cash + this.props.p_real.portfolio.history[i].total_invested_value + this.props.p_real.portfolio.history[i].latent_p_l
            perf = (current_balance/old_balance-1)*100
            diff = current_balance - old_balance
          }
          const name = this.props.p_real.portfolio.history[i].created_at.split('T')[0]
          const item = {'name': name, 'cash': cash, 'total_invested_value': total_invested_value, 'perf': perf, 'diff':diff}
          data.push(item)
        }
      }
    } else {
      if (this.props.p_demo != null &&  this.props.p_demo.portfolio.history !== undefined){
        for (let i = 0; i < this.props.p_demo.portfolio.history.length; i++) {
          const cash = this.props.p_demo.portfolio.history[i].cash
          const total_invested_value = this.props.p_demo.portfolio.history[i].total_invested_value
          var perf = null
          var diff = null
          if (i === 0){
            const old_balance = this.props.p_demo.portfolio.first_portfolio_history.cash + this.props.p_demo.portfolio.first_portfolio_history.total_invested_value + this.props.p_demo.portfolio.first_portfolio_history.latent_p_l
            const current_balance = this.props.p_demo.portfolio.history[i].cash + this.props.p_demo.portfolio.history[i].total_invested_value + this.props.p_demo.portfolio.history[i].latent_p_l
            perf = (current_balance/old_balance-1)*100
            diff = current_balance - old_balance
          } else {
            const old_balance = this.props.p_demo.portfolio.history[i-1].cash + this.props.p_demo.portfolio.history[i-1].total_invested_value + this.props.p_demo.portfolio.history[i-1].latent_p_l
            const current_balance = this.props.p_demo.portfolio.history[i].cash + this.props.p_demo.portfolio.history[i].total_invested_value + this.props.p_demo.portfolio.history[i].latent_p_l
            perf = (current_balance/old_balance-1)*100
            diff = current_balance - old_balance
          }
          const name = this.props.p_demo.portfolio.history[i].created_at.split('T')[0]
          const item = {'name': name, 'cash': cash, 'total_invested_value': total_invested_value, 'perf': perf, 'diff': diff}
          data.push(item)
        }
      }
    }
    return data
  }

  // max_drawdown = () => {
  //   var lowest_balance = null;
  //   var init_balance = this.initial_balance()
  //   if(this.props.portfolio_type) {
  //     this.props.p_real.p_history.forEach(element => {
  //       var bal = element['cash'] + element['total_invested_value']
  //       if (lowest_balance === null || bal < lowest_balance){
  //         lowest_balance = bal
  //       }
  //     });
  //   } else {
  //     this.props.p_demo.p_history.forEach(element => {
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
    if (this.props.loading){
      return(<Grid container
        spacing={0}
        direction="column"
        alignItems="center"
        justify="center"
        style={{ minHeight: '100vh' }}> <CircularProgress color='primary' /></Grid>)
    } else {
      var active = null
      var creation_date = null
      var last_update = null
      var currency = null
      var initial_balance = null
      var cash = null
      var total_investment = null
      var latent_p_l = null
      var current_balance = null
      var performance_to_date = null
      var num_of_days = null
      var annualized_performance = null 
      if (this.props.portfolio_type){
        if (this.props.p_real.portfolio != null && this.props.p_real.portfolio.history !== undefined && this.props.p_real.portfolio.history.length !== 0){
          active = this.props.p_real.portfolio.active ? 'Active' : 'Inactive'
          creation_date = this.props.p_real.portfolio.created_at.split('T')[0]
          last_update = new Date(this.props.p_real.portfolio.updated_at).toLocaleString({timeZoneName:'short'})
          currency = this.props.p_real.portfolio.currency
          initial_balance = this.props.p_real.portfolio.first_portfolio_history.cash + this.props.p_real.portfolio.first_portfolio_history.total_invested_value + this.props.p_real.portfolio.first_portfolio_history.latent_p_l
          cash = this.props.p_real.portfolio.last_portfolio_history.cash
          total_investment = this.props.p_real.portfolio.last_portfolio_history.total_invested_value
          latent_p_l = this.props.p_real.portfolio.last_portfolio_history.latent_p_l
          current_balance = cash + total_investment + latent_p_l
          performance_to_date = current_balance/initial_balance-1
          num_of_days = (Math.abs(new Date(this.props.p_real.portfolio.first_portfolio_history.created_at) - new Date(this.props.p_real.portfolio.last_portfolio_history.created_at)) / 1000) / 86400 
          annualized_performance = (1+performance_to_date)**(365/num_of_days)-1
        } 
      } else {
        if (this.props.p_demo != null && this.props.p_demo.portfolio.history && this.props.p_demo.portfolio.history.length !== 0){
          active = this.props.p_demo.portfolio.active ? 'Active' : 'Inactive'
          creation_date = this.props.p_demo.portfolio.created_at.split('T')[0]
          last_update = new Date(this.props.p_demo.portfolio.updated_at).toLocaleString({timeZoneName:'short'})
          currency = this.props.p_demo.portfolio.currency
          initial_balance = this.props.p_demo.portfolio.first_portfolio_history.cash + this.props.p_demo.portfolio.first_portfolio_history.total_invested_value + this.props.p_demo.portfolio.first_portfolio_history.latent_p_l
          cash = this.props.p_demo.portfolio.last_portfolio_history.cash
          total_investment = this.props.p_demo.portfolio.last_portfolio_history.total_invested_value
          latent_p_l = this.props.p_demo.portfolio.last_portfolio_history.latent_p_l
          current_balance = cash + total_investment + latent_p_l
          performance_to_date = current_balance/initial_balance-1
          num_of_days = (Math.abs(new Date(this.props.p_demo.portfolio.first_portfolio_history.created_at) - new Date(this.props.p_demo.portfolio.last_portfolio_history.created_at)) / 1000) / 86400 
          annualized_performance = (1+performance_to_date)**(365/num_of_days)-1
        } 
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
                  <Typography variant='body1'> {active} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Creation date: </Typography>
                  <Typography variant='body1'> {creation_date} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Last update: </Typography>
                  <Typography variant='body1'> {last_update} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Currency: </Typography>
                  <Typography variant='body1'> {currency} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Initial balance: </Typography>
                  <Typography variant='body1'> {initial_balance } </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Cash: </Typography>
                  <Typography variant='body1'> {cash} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Investments: </Typography>
                  <Typography variant='body1'> {total_investment} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Latent P&L: </Typography>
                  <Typography variant='body1' style={{color: latent_p_l > 0 ? 'green' : 'red'}}>{latent_p_l} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Current balance: </Typography>
                  <Typography variant='body1'> {current_balance} </Typography>
                </Grid>
                
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Return to date: </Typography>
                  <Typography variant='body1' style={{color: performance_to_date > 0 ? 'green' : 'red'}}> {performance_to_date > 0 && '+'}{(performance_to_date*100).toFixed(2)}% </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Days: </Typography>
                  <Typography variant='body1'> {num_of_days} </Typography>
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
              portfolio={this.props.portfolio_type ? this.props.p_real : this.props.p_demo}
              retrieve_history_details={(id) => {this.retrieve_history_details(id)}}
            />

            <BuyOrderTable 
              {...this.props}
              portfolio={this.props.portfolio_type ? this.props.p_real : this.props.p_demo}
            /> 
            
            <SellOrderTable 
              {...this.props}
              portfolio={this.props.portfolio_type ? this.props.p_real : this.props.p_demo}
            /> 
            
            </Grid>
        </Container>
      ); 
    }
  }
}

export default withStyles(styles, { withTheme: true })(Home);