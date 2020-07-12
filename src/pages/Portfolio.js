import React from 'react';
import { Container, Switch, Typography, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import {get} from '../utils/Api'


var demo_portfolio = {'portfolio_type': false, 'cash': 100000, 'total_invested_value': 12000}
var real_portfolio = {'portfolio_type': true, 'cash': 10000, 'total_invested_value': 1200}
var positions = [
  {'ticker': 'AAPL', 'invest_date': '12/06/20', 'invested_value': 340, 'invested_units': 1, 'open_rate': 340, 'current_rate': 400, 'stop_loss_rate': 300, 'take_profit_rate': 400},
  {'ticker': 'MSFT', 'invest_date': '12/06/20', 'invested_value': 180, 'invested_units': 1, 'open_rate': 180, 'current_rate': 170, 'stop_loss_rate': 150, 'take_profit_rate': 220}
]

class Portfolio extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      portfolio_type: true,
      demo_portfolio: '',
      demo_positions: [],
      real_portfolio: '',
      real_positions: [],
    };
  }

  componentDidMount() {
    this.retrieve_portfolio()
  }

  retrieve_portfolio = async () => {
    get('api/retrieve_portfolio/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({
          demo_portfolio: response.p_demo.portfolio,
          demo_positions: response.p_demo.positions,
          real_portfolio: response.p_real.portfolio,
          real_positions: response.p_real.positions,
        })
      }
    })
  }

  get_portfolio = async () => {
    get('api/update_portfolio/').then((resp) => {
        console.log(resp)
    })
  }

  handlePortfolioChange = async (e) => {
    this.setState({portfolio_type: !this.state.portfolio_type})
  }

  renderPositions = () => {
    var positions = []
    if (this.state.portfolio_type) {
      positions = this.state.real_positions
    } else {
      positions = this.state.demo_positions
    }
    return(
      positions.map((position) => (
        <TableRow key={position.symbol}>
          <TableCell component="th" scope="row">{position.stock.symbol} </TableCell>
          <TableCell align="right">{position.invest_date}</TableCell>
          <TableCell align="right">{position.invest_value}</TableCell>
          <TableCell align="right">{position.invest_units}</TableCell>
          <TableCell align="right">{position.open_rate}</TableCell>
          <TableCell align="right">{position.current_rate}</TableCell>
          <TableCell align="right">{position.stop_loss_rate}</TableCell>
          <TableCell align="right">{position.take_profit_rate}</TableCell>
          <TableCell align="right" style={{color: position.current_rate - position.open_rate > 0 ? 'green' : 'red'}}> {position.current_rate - position.open_rate } </TableCell>
        </TableRow>
      ))
    )
  }

  renderPortfolio = () => {
    if (this.state.portfolio_type) {
      var portfolio = this.state.real_portfolio
    } else {
      var portfolio = this.state.demo_portfolio
    }
    return (
      <Grid container direction="row" alignItems="center" justify="center">
        <Typography style={{paddingRight: 10}}>
          Cash: {portfolio.cash}
        </Typography>
        <Typography>
          Total invested value: {portfolio.total_invested_value}
        </Typography>
      </Grid>
    )
  }
  render() {
    return (
      <Container>
        <Grid container direction="row" alignItems="center" justify="center">
          <Typography>
            {this.state.portfolio_type && 'Real portfolio'}
            {!this.state.portfolio_type && 'Demo portfolio'}
          </Typography>
          <Switch
            checked={this.state.portfolio_type}
            onChange={e => {this.handlePortfolioChange(e);}}
            name="portfolio_type"
            color="primary"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={() => {this.get_portfolio()}}
          >
            Get portfolio
          </Button>
        </Grid>
        <Grid container style={{paddingBottom: 10}} direction="column" alignItems="center" justify="center">
          {this.renderPortfolio()}
        </Grid>
        <Grid container direction="column">
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell align="right">Investment date</TableCell>
                  <TableCell align="right">Invested value </TableCell>
                  <TableCell align="right">Invested units</TableCell>
                  <TableCell align="right">Open rate</TableCell>
                  <TableCell align="right">Current rate</TableCell>
                  <TableCell align="right">Stop loss rate</TableCell>
                  <TableCell align="right">Take profit rate</TableCell>
                  <TableCell align="right">Unrealized gain/loss</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.renderPositions()}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Container>
    ); 
  }
}

export default Portfolio