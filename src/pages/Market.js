import React from 'react';
import { Container, Grid, Table, TableBody, TableCell, TableSortLabel, TableContainer, TableHead, TableRow, Paper, Typography } from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {
  
}

class Market extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stocks:[],
      predictions: [],
      sorting_col: 'symbol',
      sorting_dir: 'desc'
    }
  }

  componentDidMount(){
    console.log(this.props)
    this.retrieve_market()
  }

  retrieve_market = async () => {
    get('api/retrieve_market/').then((resp) => {
      console.log(resp)
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({'stocks': response.stocks})
      }
    })
  }

  renderStocks = () => {
    var stocks = this.state.stocks
    return(
      stocks.map((stock) => (
        <TableRow key={stock.symbol}>
          <TableCell component="th" scope="row"> {stock.symbol}  </TableCell>
          <TableCell component="th" scope="row" >{stock.name}</TableCell>
          <TableCell component="th" scope="row">{stock.sector} </TableCell>
          <TableCell component="th" scope="row">{stock.industry} </TableCell>
          <TableCell component="th" scope="row" align="right">{stock.last_price === null ? 'None' : stock.last_price.price_date} </TableCell>
          <TableCell component="th" scope="row" align="right">{stock.last_price === null ? 'None' : Math.round(stock.last_price.close)} </TableCell>
          <TableCell component="th" scope="row" align="right"> {this.props.portfolio_type ? stock.last_real_pred.prediction === null ? 'None' : stock.last_real_pred.prediction.toFixed(3) : stock.last_demo_pred.prediction === null ? 'None' :  stock.last_demo_pred.prediction.toFixed(3)} </TableCell>

        </TableRow>
      ))
    )
  }

  name_sorter = (col, order) => {
    if (order === 'asc') {
        this.state.stocks.sort((a, b) => a.stock[col].localeCompare(b.stock[col]))
    } else {
        this.state.stocks.sort((a, b) => b.stock[col].localeCompare(a.stock[col]))
    }
  }

  number_sorter = (col, order) => {
    if (col === 'prediction') {
      if (this.props.portfolio_type){
          if (order === 'asc') {
            this.state.stocks.sort((a,b) => a.last_real_pred.prediction < b.last_real_pred.prediction ? 1 : -1)
        } else {
            this.state.stocks.sort((a,b) => a.last_real_pred.prediction > b.last_real_pred.prediction ? 1 : -1)
        }
      } else {
        if (order === 'asc') {
          this.state.stocks.sort((a,b) => a.last_demo_pred.prediction < b.last_demo_pred.prediction ? 1 : -1)
      } else {
          this.state.stocks.sort((a,b) => a.last_demo_pred.prediction > b.last_demo_pred.prediction ? 1 : -1)
      }
      }
    } else {
        if (order === 'asc') {
          this.state.stocks.sort((a,b) => a[col] < b[col] ? 1 : -1)
      } else {
          this.state.stocks.sort((a,b) => a[col] > b[col] ? 1 : -1)
      }
    }
  }

  p_l_sorter = (col, order) => {
    if (order === 'asc') {
        this.state.stocks.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) < ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
    } else {
        this.state.stocks.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) > ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
    }
  }

  sorter = (col, order) => {
    switch (col) {
        case 'symbol':
            this.name_sorter(col, order)
        break;
        case 'name':
            this.name_sorter(col, order)
            break;
        case 'sector':
            this.name_sorter(col, order)
            break;
        case 'industry':
            this.number_sorter(col, order)
            break;
        case 'price_date':
            this.number_sorter(col, order)
            break;
        case 'close_price':
          this.number_sorter(col, order)
          break;
        case 'prediction':
            this.number_sorter(col, order)
            break;
        default:
            console.log('Unknown col');
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

  render() {
    return (
      <Container>
      <Grid container direction="row" alignItems="center" justify="center">
        <Typography variant='h6' style={{margin:10}}>
          Investment universe: {this.state.stocks.length} stocks
        </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" style={{tableLayout:'fixed', width:'100%'}}>
              <TableHead>
                <TableRow>
                  <TableCell> <Typography variant='body2'>Symbol</Typography>
                    <TableSortLabel active={this.state.sorting_col==='symbol'} direction={this.state.sorting_dir} id='symbol' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell > <Typography variant='body2'>Name</Typography>
                    <TableSortLabel active={this.state.sorting_col==='name'} direction={this.state.sorting_dir} id='name' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell ><Typography variant='body2'>Sector</Typography>
                    <TableSortLabel active={this.state.sorting_col==='sector'} direction={this.state.sorting_dir} id='sector' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell ><Typography variant='body2'>Industry</Typography>
                    <TableSortLabel active={this.state.sorting_col==='industry'} direction={this.state.sorting_dir} id='industry' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right" ><Typography variant='body2'>Price date</Typography> 
                    <TableSortLabel active={this.state.sorting_col==='price_date'} direction={this.state.sorting_dir} id='price_date' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right" ><Typography variant='body2'>Closing price</Typography>
                    <TableSortLabel active={this.state.sorting_col==='close_price'} direction={this.state.sorting_dir} id='close_price' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right" ><Typography variant='body2'>{this.props.portfolio_type ? this.props.p_real.portfolio.neural_network.nn_name : this.props.p_demo.portfolio.neural_network.nn_name} prediction</Typography>
                    <TableSortLabel active={this.state.sorting_col==='prediction'} direction={this.state.sorting_dir} id='prediction' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.renderStocks()}
              </TableBody>
            </Table>
          </TableContainer>
      </Grid>
      </Container>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Market);
