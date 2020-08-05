import React from 'react';
import { Container, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class History extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        history_demo: [],
        history_real: [],
    };
  }

  componentDidMount() {
    this.retrieve_history()
  }

  retrieve_history = async () => {
    console.log('retrieve_order')
    get('api/retrieve_history/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({
            history_demo: response.p_demo.history,
            history_real: response.p_real.history,
        })
      }
    })
  }

  renderHistory = () => {
    var positions = []
    if (this.props.portfolio_type) {
      positions = this.state.history_real
    } else {
      positions = this.state.history_demo
    }

    return(
      positions.map((position) => (
        <TableRow key={position.id}>
          <TableCell component="th" scope="row">{position.stock !== null ? position.stock.symbol : 'Unknown'} </TableCell>
          <TableCell component="th" scope="row">{position.stock !== null ? position.stock.name : 'Unknown'} </TableCell>
          <TableCell align="right">{position.total_investment}</TableCell>
          <TableCell align="right">{position.num_of_shares}</TableCell>
          <TableCell align="right">{position.open_rate}</TableCell>
          <TableCell align="right">{position.open_date === null ? 'N.A.' : new Date(position.open_date).toLocaleString({timeZoneName:'short'})}</TableCell>
          <TableCell align="right">{position.close_rate}</TableCell>
          <TableCell align="right">{new Date(position.close_date).toLocaleString({timeZoneName:'short'})}</TableCell>
          <TableCell align="right" style={{color: position.close_rate - position.open_rate > 0 ? 'green' : 'red'}}> {Math.round(position.close_rate - position.open_rate) } </TableCell>
          <TableCell align="right" style={{color: position.close_rate - position.open_rate > 0 ? 'green' : 'red'}}> {((position.close_rate/position.open_rate-1)*100).toFixed(2)+"%" } </TableCell>
        </TableRow>
      ))
    )
  }


  render() {
    return (
      <Container>
        <Grid  container direction="column" alignItems="center" justify="center">
        <Typography variant="h4" style={{margin:5}}>
            {this.props.portfolio_type && 'Real history'}
            {!this.props.portfolio_type && 'Demo history'}
        </Typography>
            <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Total investment </TableCell>
                  <TableCell align="right"># of shares</TableCell>
                  <TableCell align="right">Open rate</TableCell>
                  <TableCell align="right">Open date</TableCell>
                  <TableCell align="right">Close rate</TableCell>
                  <TableCell align="right">Close date</TableCell>
                  <TableCell align="right">gain/loss €</TableCell>
                  <TableCell align="right">gain/loss %</TableCell>
                </TableRow>
              </TableHead>
                <TableBody>
                  {this.renderHistory()}
                </TableBody>
            </Table>
          </TableContainer>
          </Grid>
      </Container>
    ); 
  }
}
export default withStyles(styles, { withTheme: true })(History);