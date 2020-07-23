import React from 'react';
import { Grid, Button, Table, TableBody, TableCell, TableSortLabel, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import {get} from '../utils/Api'

class Model extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sma_backtests:[],
      sorting_col: 'symbol',
      sorting_dir: 'desc'
    }
  }

  componentDidMount(){
    this.retrieve_model()
  }

  retrieve_model = async () => {
    get('api/retrieve_model/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({'sma_backtests': response.sma_backtest})
      }
    })
  }

  render_Sma_backtests = () => {
    var sma_backtests = this.state.sma_backtests
    return(
        sma_backtests.map((sma_backtest) => (
        <TableRow key={sma_backtest.id}>
          <TableCell component="th" scope="row">{sma_backtest.stock.symbol} </TableCell>
          <TableCell align="right" >{sma_backtest.model.high_sma} / {sma_backtest.model.low_sma} </TableCell>
          <TableCell align="right" >{parseFloat(sma_backtest.model_cagr*100).toFixed(2)+"%"}</TableCell>
          <TableCell align="right" >{parseFloat(sma_backtest.precision*100).toFixed(2)+"%"}</TableCell>
          <TableCell align="right" >{Math.round(sma_backtest.score)}</TableCell>
          <TableCell align="right" >{sma_backtest.sma_position.length === 0 ? 'None' : sma_backtest.sma_position[0].price_date}</TableCell>
          <TableCell align="right" style={{color: sma_backtest.sma_position.length === 0 ? 'black' : sma_backtest.sma_position[0].buy ? 'green' : 'red'}} >{sma_backtest.sma_position.length === 0 ? 'None' : sma_backtest.sma_position[0].buy ? 'BUY' : 'SELL'}</TableCell>
        </TableRow>
      ))
    )
  }

  sorter = (col, order) => {
    if (order === 'asc') {
        this.state.sma_backtests.sort(function(a, b) { return a[col] - b[col] } )
      } else {
        this.state.sma_backtests.sort(function(a, b) { return b[col] - a[col] } )
      }
  }

  handleSorting = (e) => {
    if (this.state.sorting_dir === 'asc') {
      this.sorter(e.currentTarget.id, 'desc')
      this.setState({sorting_col: e.currentTarget.id, sorting_dir:'desc'})
    } else {
      this.sorter(e.currentTarget.id, 'asc')
      this.setState({sorting_col: e.currentTarget.id, sorting_dir:'asc'})
    }
  }

  update_sma_positions = async () => {
    get('api/update_sma_positions/').then((resp) => {
        console.log(resp)
    })
  }


  render() {
    return (
        <Grid container direction="row" alignItems="center" justify="center"> 
            <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={() => {this.update_sma_positions()}}
                style={{margin: 10}}
            >
                Update positions
            </Button>
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell style={{fontWeight:'bold'}}>Symbol
                    <TableSortLabel active={this.state.sorting_col==='symbol'} direction={this.state.sorting_dir} id='symbol' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right"  style={{fontWeight:'bold'}}>Model
                    <TableSortLabel active={this.state.sorting_col==='model'} direction={this.state.sorting_dir} id='model' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right"  style={{fontWeight:'bold'}}>CAGR
                    <TableSortLabel active={this.state.sorting_col==='model_cagr'} direction={this.state.sorting_dir} id='model_cagr' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right"  style={{fontWeight:'bold'}}>Precision
                    <TableSortLabel active={this.state.sorting_col==='precision'} direction={this.state.sorting_dir} id='precision' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right" style={{fontWeight:'bold'}}>Score
                    <TableSortLabel active={this.state.sorting_col==='score'} direction={this.state.sorting_dir} id='score' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right" style={{fontWeight:'bold'}}>Position date
                    <TableSortLabel active={this.state.sorting_col==='sma_position_date'} direction={this.state.sorting_dir} id='sma_position_date' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right" style={{fontWeight:'bold'}}>SMA Position
                    <TableSortLabel active={this.state.sorting_col==='sma_position'} direction={this.state.sorting_dir} id='sma_position' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.render_Sma_backtests()}
              </TableBody>
            </Table>
          </TableContainer>
          </Grid>
    )
  }
}

export default Model