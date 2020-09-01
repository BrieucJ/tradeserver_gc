import React from 'react';
import { Collapse, Box, Container, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import IconButton from '@material-ui/core/IconButton';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class History extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        open_id: null,
        history_demo: [],
        history_real: [],
    };
  }

  componentDidMount() {
    this.retrieve_history()
  }

  retrieve_history = async () => {
    console.log('retrieve_history')
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

  retrieve_history_details = async (id) => {
    console.log('retrieve_history_details')
    get('api/retrieve_history_details/?id='+id).then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
        // this.setState({
        //     history_demo: response.p_demo.history,
        //     history_real: response.p_real.history,
        // })
      }
    })
  }

  holding_duration = (open_date, close_date) => {
    var delta = Math.abs(new Date(open_date) - new Date(close_date)) / 1000;
    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;
    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    
    if (days < 1){
      return `${(hours/24).toLocaleString(undefined, {maximumFractionDigits: 2})} day` 
    } else {
      return `${days},${(hours/24).toLocaleString(undefined, {maximumFractionDigits: 0})} day(s)` 
    }
  }

  handle_open = async (id) => {
    if (id === this.state.open_id){
      this.setState({open_id: null})
    } else {
      this.setState({open_id: id})
      this.retrieve_history_details(id)
    }
  }

  renderHistory(){
    if(this.props.portfolio_type) {
      var history_real = this.state.history_real
      return(
        <TableContainer component={Paper} style={{ overflow: 'auto'}} >
          <Table size="small" stickyHeader aria-label="sticky table" >
          <TableHead>
            <TableRow>
              <TableCell>Name
              </TableCell>
              <TableCell>Sector
              </TableCell>
              <TableCell align="right">Open date 
              </TableCell>
              <TableCell align="right">Close date
              </TableCell>
              <TableCell align="right">Duration
              </TableCell>
              <TableCell align="right">Open rate 
              </TableCell>
              <TableCell align="right">Close rate
              </TableCell>
              <TableCell align="right">P/L</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {history_real.map((hi) => (
              <TableRow key={hi.id}>
                <TableCell>
                  <IconButton aria-label="expand row" size="small" onClick={() => this.handle_open(hi.id)}>
                    {this.state.open_id === hi.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">{hi.stock.name} </TableCell>
                <TableCell component="th" scope="row">{hi.stock.sector} </TableCell>
                <TableCell align="right"> {new Date(hi.open_date).toLocaleString({timeZoneName:'short'})} </TableCell>
                <TableCell align="right"> {new Date(hi.close_date).toLocaleString({timeZoneName:'short'})} </TableCell>
                <TableCell align="right"> {this.holding_duration(hi.open_date, hi.close_date)} </TableCell>
                <TableCell align="right"> {hi.open_rate.toLocaleString(undefined, {maximumFractionDigits: 2 })} </TableCell>
                <TableCell align="right"> {hi.close_rate.toLocaleString(undefined, {maximumFractionDigits: 2 })} </TableCell>
                <TableCell align="right" style={{color: hi.close_rate > hi.open_rate ? 'green' : 'red'}} > 
                   {((hi.close_rate/hi.open_rate-1)*100).toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    } else {
      var history_demo = this.state.history_demo
      return(
        <TableContainer component={Paper} style={{ overflow: 'auto'}} >
          <Table size="small" stickyHeader aria-label="sticky table" >
          <TableHead>
            <TableRow>
              <TableCell>Name
              </TableCell>
              <TableCell>Sector
              </TableCell>
              <TableCell align="right">created_at 
              </TableCell>
              <TableCell align="right">Open date 
              </TableCell>
              <TableCell align="right">Close date
              </TableCell>
              <TableCell align="right">Duration
              </TableCell>
              <TableCell align="right">Open rate 
              </TableCell>
              <TableCell align="right">Close rate
              </TableCell>
              <TableCell align="right">P/L</TableCell>
              <TableCell></TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {history_demo.map((hi) => (
              <TableRow hover key={hi.id} onClick={() => {this.props.history.push('/position/?id='+hi.id)}} >
                <TableCell component="th" scope="row">{hi.stock.name} </TableCell>
                <TableCell component="th" scope="row">{hi.stock.sector} </TableCell>
                <TableCell align="right"> {new Date(hi.created_at).toLocaleString({timeZoneName:'short'})} </TableCell>
                <TableCell align="right"> {new Date(hi.open_date).toLocaleString({timeZoneName:'short'})} </TableCell>
                <TableCell align="right"> {new Date(hi.close_date).toLocaleString({timeZoneName:'short'})} </TableCell>
                <TableCell align="right"> {this.holding_duration(hi.open_date, hi.close_date)} </TableCell>
                <TableCell align="right"> {hi.open_rate.toLocaleString(undefined, {maximumFractionDigits: 2 })} </TableCell>
                <TableCell align="right"> {hi.close_rate.toLocaleString(undefined, {maximumFractionDigits: 2 })} </TableCell>
                <TableCell align="right" style={{color: hi.close_rate > hi.open_rate ? 'green' : 'red'}} > 
                   {((hi.close_rate/hi.open_rate-1)*100).toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }
  }


  render() {
    return (
      <Grid container spacing={0} direction="column" alignItems="center" justify="center" >
        <Grid item xs={12} sm={10}>
        <Typography variant="h4" style={{margin:5}}>
            {this.props.portfolio_type && 'Real history'}
            {!this.props.portfolio_type && 'Demo history'}
        </Typography>
          {this.renderHistory()}
          </Grid>
      </Grid>
    ); 
  }
}
export default withStyles(styles, { withTheme: true })(History);