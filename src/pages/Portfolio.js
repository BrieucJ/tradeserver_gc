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
      portfolio_type: false,
    };
  }

  get_portfolio = async () => {
    get('api/update_portfolio/').then((resp) => {
        console.log(resp)
    })
  }

  handlePortfolioChange = async (e) => {
    this.setState({portfolio_type: !this.state.portfolio_type})
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
          {this.state.portfolio_type && 
            <Grid container direction="row" alignItems="center" justify="center">
              <Typography style={{paddingRight: 10}}>
                Cash: {real_portfolio.cash}
              </Typography>
              <Typography>
                Total invested value: {real_portfolio.total_invested_value}
              </Typography>
            </Grid>
          }
          {!this.state.portfolio_type && 
            <Grid container direction="row" alignItems="center" justify="center">
              <Typography style={{paddingRight: 10}}>
                Cash: {demo_portfolio.cash}
              </Typography>
              <Typography>
                Total invested value: {demo_portfolio.total_invested_value}
              </Typography>
            </Grid>
          }
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
                {positions.map((position) => (
                  <TableRow key={position.ticker}>
                    <TableCell component="th" scope="row">{position.ticker} </TableCell>
                    <TableCell align="right">{position.invest_date}</TableCell>
                    <TableCell align="right">{position.invested_value}</TableCell>
                    <TableCell align="right">{position.invested_units}</TableCell>
                    <TableCell align="right">{position.open_rate}</TableCell>
                    <TableCell align="right">{position.current_rate}</TableCell>
                    <TableCell align="right">{position.stop_loss_rate}</TableCell>
                    <TableCell align="right">{position.take_profit_rate}</TableCell>
                    <TableCell align="right" style={{color: position.current_rate - position.open_rate > 0 ? 'green' : 'red'}}> {position.current_rate - position.open_rate } </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Container>
    ); 
  }
}

export default Portfolio