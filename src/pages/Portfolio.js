import React, {Fragment} from 'react';
import { Container, Switch, Typography, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Portfolio extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      demo_portfolio: '',
      current_demo_positions: [],
      real_portfolio: '',
      current_real_positions: [],
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
          current_demo_positions: response.p_demo.current_positions,
          real_portfolio: response.p_real.portfolio,
          current_real_positions: response.p_real.current_positions,
        })
      }
    })
  }

  renderCurrentPositions = () => {
    var positions = []
    if (this.props.portfolio_type) {
      positions = this.state.current_real_positions
    } else {
      positions = this.state.current_demo_positions
    }

    return(
      positions.map((position) => (
        <TableRow key={position.id}>
          <TableCell component="th" scope="row">{position.stock !== null ? position.stock.symbol : 'Unknown'} </TableCell>
          <TableCell component="th" scope="row">{position.stock !== null ? position.stock.name : 'Unknown'} </TableCell>
          <TableCell align="right">{position.open_date === null ? 'N.A.' : new Date(position.open_date).toLocaleString({timeZoneName:'short'})}</TableCell>
          <TableCell align="right">{position.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })}</TableCell>
          <TableCell align="right">{position.num_of_shares}</TableCell>
          <TableCell align="right" style={{color: position.current_rate - position.open_rate > 0 ? 'green' : 'red'}}> {Math.round(position.current_rate*position.num_of_shares - position.open_rate*position.num_of_shares)} </TableCell>
          <TableCell align="right" style={{color: position.current_rate - position.open_rate > 0 ? 'green' : 'red'}}> {((position.current_rate/position.open_rate-1)*100).toFixed(2)+"%"} </TableCell>
        </TableRow>
      ))
    )
  }

  renderPortfolio = () => {
    if (this.props.portfolio_type) {
      var portfolio = this.state.real_portfolio
    } else {
      var portfolio = this.state.demo_portfolio
    }
    return (
      <Grid container direction="row" alignItems="center" justify="center" style={{padding:10}}>
        <Typography variant='h6' style={{paddingRight: 10}}>
          Cash: {portfolio.cash != undefined ? portfolio.cash.toLocaleString(undefined, {maximumFractionDigits: 0 }) : 'None'} {portfolio.currency}
        </Typography>
        <Typography variant='h6'>
          Total invested value: {portfolio.total_invested_value != undefined ? portfolio.total_invested_value.toLocaleString(undefined, {maximumFractionDigits: 0 }) : 'None'} {portfolio.currency}
        </Typography>
      </Grid>
    )
  }

  render() {
    const { classes, theme } = this.props;
    return (
      <Container>
        <Grid container direction="column" alignItems="center" justify="center">
          <Typography variant="h4" style={{margin:5}}>
            {this.props.portfolio_type && 'Real portfolio'}
            {!this.props.portfolio_type && 'Demo portfolio'}
          </Typography>
          <Typography variant='body1' style={{paddingRight: 10}}>
            {this.props.portfolio_type ? new Date(this.state.real_portfolio.updated_at).toLocaleString({timeZoneName:'short'}) : new Date(this.state.demo_portfolio.updated_at).toLocaleString({timeZoneName:'short'}) }
          </Typography>          
        </Grid>
        <Grid container direction="column" alignItems="center" justify="center">
          {this.renderPortfolio()}
        </Grid>
        <Grid container direction="column" alignItems="center" justify="center">
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Open date</TableCell>
                  <TableCell align="right">Total investment </TableCell>
                  <TableCell align="right"># of shares</TableCell>
                  <TableCell align="right">Unrealized gain/loss $ </TableCell>
                  <TableCell align="right">Unrealized gain/loss % </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.renderCurrentPositions()}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Container>
    ); 
  }
}
export default withStyles(styles, { withTheme: true })(Portfolio);