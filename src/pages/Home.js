import React from 'react';
import { Button, Container, Grid, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel} from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';
import Area_Chart from '../components/AreaChart'

const styles = {

}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sorting_col: 'total_investment',
      sorting_dir: 'asc',
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
    // this.update_portfolio()
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
    })
  }

  update_prices = async () => {
    get('api/update_price_history/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
      }
    })
  }

  update_orders = async () => {
    get('api/update_orders/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
      }
    })
  }

  transmit_orders = async () => {
    get('api/transmit_orders/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
      }
    })
  }

  update_portfolio = async () => {
    get('api/update_portfolio/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
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

  holding_duration = (open_date) =>{
    var delta = Math.abs(new Date(open_date) - new Date()) / 1000;
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

  total_balance = (portfolio) => {
    var cash = portfolio.last_portfolio_history.cash
    var inv = portfolio.last_portfolio_history.total_invested_value
    return cash + inv
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

  renderBuyOrders(){
    if(this.props.portfolio_type) {
      var bos_real = this.state.p_real.pending_buy_orders
      return(
      <TableContainer component={Paper} style={{ overflow: 'auto', height: '150px' }} >
        <Table aria-label="simple table" style={{tableLayout: 'fixed'}} >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount </TableCell>
              <TableCell align="right">Submited/canceled</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {bos_real.map((bo) => (
              <TableRow key={bo.id}>
                <TableCell component="th" scope="row">{bo.stock.name.substring(0,20)} </TableCell>
                <TableCell align="right"> {bo.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right" style={{color: bo.canceled_at !== null && 'red'}} > {bo.submited_at === null ? 'Not sent' : bo.canceled_at !== null ? new Date(bo.canceled_at).toLocaleString({timeZoneName:'short'}) : new Date(bo.submited_at).toLocaleString({timeZoneName:'short'})} </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    } else {
      var bos_demo = this.state.p_demo.pending_buy_orders
      return(
        <TableContainer component={Paper} style={{ overflow: 'auto', height: '300px' }} >
          <Table size="small" stickyHeader aria-label="sticky table" >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount </TableCell>
              <TableCell align="right">Submited/canceled</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {bos_demo.map((bo) => (
              <TableRow key={bo.id}>
                <TableCell component="th" scope="row">{bo.stock.name.substring(0,20)} </TableCell>
                <TableCell align="right"> {bo.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right" style={{color: bo.canceled_at !== null && 'red'}} > {bo.submited_at === null ? 'Not sent' : bo.canceled_at !== null ? new Date(bo.canceled_at).toLocaleString({timeZoneName:'short'}) : new Date(bo.submited_at).toLocaleString({timeZoneName:'short'})} </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }
  }

  renderSellOrders(){
    if(this.props.portfolio_type) {
      var sos_real = this.state.p_real.pending_sell_orders
      return(
      <TableContainer component={Paper} style={{ overflow: 'auto', height: '150px' }} >
        <Table aria-label="simple table" style={{tableLayout: 'fixed'}} >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount </TableCell>
              <TableCell align="right">Submited</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {sos_real.map((so) => (
              <TableRow key={so.id}>
                <TableCell component="th" scope="row">{so.stock.name.substring(0,20)} </TableCell>
                <TableCell align="right"> {so.position.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right" > {so.submited_at === null ? 'Not sent' : new Date(so.submited_at).toLocaleString({timeZoneName:'short'}) } </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    } else {
      var sos_demo = this.state.p_demo.pending_sell_orders
      return(
        <TableContainer component={Paper} style={{ overflow: 'auto', height: '300px' }} >
          <Table size="small" stickyHeader aria-label="sticky table" >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount </TableCell>
              <TableCell align="right">Submited</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {sos_demo.map((so) => (
              <TableRow key={so.id}>
                <TableCell component="th" scope="row">{so.stock.name.substring(0,20)} </TableCell>
                <TableCell align="right"> {so.position.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right" > {so.submited_at === null ? 'Not sent' : new Date(so.submited_at).toLocaleString({timeZoneName:'short'}) } </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }
  }

  name_sorter = (col, order) => {
    if (order === 'asc') {
      if (this.props.portfolio_type){
        this.state.p_real.current_positions.sort((a, b) => a.stock[col].localeCompare(b.stock[col]))
      } else {
        this.state.p_demo.current_positions.sort((a, b) => a.stock[col].localeCompare(b.stock[col]))
      }
    } else {
      if (this.props.portfolio_type){
        this.state.p_real.current_positions.sort((a, b) => b.stock[col].localeCompare(a.stock[col]))
      } else {
        this.state.p_demo.current_positions.sort((a, b) => b.stock[col].localeCompare(a.stock[col]))
      }
    }
  }

  number_sorter = (col, order) => {
    if (order === 'asc') {
      if (this.props.portfolio_type){
        this.state.p_real.current_positions.sort((a,b) => a[col] < b[col] ? 1 : -1)
      } else {
        this.state.p_demo.current_positions.sort((a,b) => a[col] < b[col] ? 1 : -1)
      }
    } else {
      if (this.props.portfolio_type){
        this.state.p_real.current_positions.sort((a,b) => a[col] > b[col] ? 1 : -1)
      } else {
        this.state.p_demo.current_positions.sort((a,b) => a[col] > b[col] ? 1 : -1)
      }
    }
  }

  p_l_sorter = (col, order) => {
    if (order === 'asc') {
      if (this.props.portfolio_type){
        this.state.p_real.current_positions.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) < ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
      } else {
        this.state.p_demo.current_positions.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) < ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
      }
    } else {
      if (this.props.portfolio_type){
        this.state.p_real.current_positions.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) > ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
      } else {
        this.state.p_demo.current_positions.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) > ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
      }
    }
  }

  sorter = (col, order) => {
    console.log('sorter')
    switch (col) {
      case 'name':
        this.name_sorter(col, order)
        break;
      case 'sector':
          this.name_sorter(col, order)
          break;
      case 'total_investment':
        this.number_sorter(col, order)
        break;
      case 'alloc_percentage':
          this.number_sorter('total_investment', order)
          break;
      case 'P_L':
        this.p_l_sorter(col, order)
        break;
      case 'open_date':
        this.number_sorter(col, order)
          break;
      default:
        console.log('Unknown col');
    }
  }

  handleSorting = (e) => {
    console.log('handleSorting')
    if (this.state.sorting_dir === 'asc') {
      this.sorter(e.currentTarget.id, 'desc')
      this.setState({sorting_col: e.currentTarget.id, sorting_dir:'desc'})
    } else {
      this.sorter(e.currentTarget.id, 'asc')
      this.setState({sorting_col: e.currentTarget.id, sorting_dir:'asc'})
    }
  }

  renderPortfolio(){
    var date_time = new Date();
    var day_num = date_time.getDay()

    if (day_num === 0 || day_num === 6){
      if (day_num === 0){
        date_time.setDate(date_time.getDate() - 2);
      }
      if (day_num === 6){
        date_time.setDate(date_time.getDate() - 1);
      }
    } else {
      date_time.setDate(date_time.getDate() - 1);
    }

    var day = date_time.getDate()
    var month = date_time.getMonth() + 1 //January is 0!
    var year = date_time.getFullYear();
    var last_business_day = year + '-' + ('0' + month).slice(-2) + '-' + ('0' + day).slice(-2);
    
    if(this.props.portfolio_type) {
      var pos_real = this.state.p_real.current_positions
      return(
        <TableContainer component={Paper} style={{ overflow: 'auto', height: '300px' }} >
          <Table size="small" stickyHeader aria-label="sticky table" >
          <TableHead>
            <TableRow>
              <TableCell>Name
                <TableSortLabel active={this.state.sorting_col==='name'} direction={this.state.sorting_dir} id='name' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell>Sector
                <TableSortLabel active={this.state.sorting_col==='sector'} direction={this.state.sorting_dir} id='sector' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">Amount 
                <TableSortLabel active={this.state.sorting_col==='total_investment'} direction={this.state.sorting_dir} id='total_investment' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">% 
                <TableSortLabel active={this.state.sorting_col==='alloc_percentage'} direction={this.state.sorting_dir} id='alloc_percentage' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">P/L
                <TableSortLabel active={this.state.sorting_col==='P_L'} direction={this.state.sorting_dir} id='P_L' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">Duration
                <TableSortLabel active={this.state.sorting_col==='open_date'} direction={this.state.sorting_dir} id='open_date' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">Position</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {pos_real.map((po) => (
              <TableRow key={po.id}>
                <TableCell component="th" scope="row">{po.stock.name.substring(0,20)}  </TableCell>
                <TableCell component="th" scope="row">{po.stock.sector.substring(0,20)}  </TableCell>
                <TableCell align="right"> {po.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right"> { ((po.total_investment / this.total_balance(this.state.p_real.portfolio)) * 100).toFixed(2)}% </TableCell>
                <TableCell align="right" style={{color: po.current_rate > po.open_rate ? 'green' : 'red'}} > 
                  {((po.current_rate - po.open_rate) * po.num_of_shares).toLocaleString(undefined, {maximumFractionDigits: 0 })} | {((po.current_rate/po.open_rate-1)*100).toFixed(2)}%
                </TableCell>
                <TableCell align="right"> {this.holding_duration(po.open_date)} </TableCell>
                <TableCell align="right" style={{color: po.stock.last_sma_position.buy ? 'green' : 'red'}}> {po.stock.last_sma_position.buy ? 'BUY' : 'SELL'} | <Typography style={{color: po.stock.last_sma_position.price_date === last_business_day ? 'green' : 'red', display: 'inline-block'}} variant='body2'> {po.stock.last_sma_position.price_date === last_business_day ? '✓' : po.stock.last_sma_position.price_date} </Typography> </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    } else {
      var pos_demo = this.state.p_demo.current_positions
      return(
        <TableContainer component={Paper} style={{ overflow: 'auto', height: '300px' }} >
          <Table size="small" stickyHeader aria-label="sticky table" >
          <TableHead>
            <TableRow>
              <TableCell>Name
                <TableSortLabel active={this.state.sorting_col==='name'} direction={this.state.sorting_dir} id='name' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell>Sector
                <TableSortLabel active={this.state.sorting_col==='sector'} direction={this.state.sorting_dir} id='sector' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">Amount 
                <TableSortLabel active={this.state.sorting_col==='total_investment'} direction={this.state.sorting_dir} id='total_investment' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">% 
                <TableSortLabel active={this.state.sorting_col==='alloc_percentage'} direction={this.state.sorting_dir} id='alloc_percentage' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">P/L 
                <TableSortLabel active={this.state.sorting_col==='P_L'} direction={this.state.sorting_dir} id='P_L' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">Duration
                <TableSortLabel active={this.state.sorting_col==='open_date'} direction={this.state.sorting_dir} id='open_date' onClick={e => {this.handleSorting(e)}} />
              </TableCell>
              <TableCell align="right">Position</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {pos_demo.map((po) => (
              <TableRow key={po.id}>
                <TableCell component="th" scope="row">{po.stock.name.substring(0,20)} </TableCell>
                <TableCell component="th" scope="row">{po.stock.sector.substring(0,20)}  </TableCell>
                <TableCell align="right"> {po.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right"> { ((po.total_investment / this.total_balance(this.state.p_demo.portfolio)) * 100).toFixed(2)}% </TableCell>
                <TableCell align="right" style={{color: po.current_rate > po.open_rate ? 'green' : 'red'}} > 
                  {((po.current_rate - po.open_rate) * po.num_of_shares).toLocaleString(undefined, {maximumFractionDigits: 0 })} | {((po.current_rate/po.open_rate-1)*100).toFixed(2)}%
                </TableCell>
                <TableCell align="right"> {this.holding_duration(po.open_date)} </TableCell>
                <TableCell align="right" style={{color: po.stock.last_sma_position.buy ? 'green' : 'red'}}> {po.stock.last_sma_position.buy ? 'BUY' : 'SELL'} | <Typography style={{color: po.stock.last_sma_position.price_date === last_business_day ? 'green' : 'red', display: 'inline-block'}} variant='body2'> {po.stock.last_sma_position.price_date === last_business_day ? '✓' : po.stock.last_sma_position.price_date} </Typography> </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }
  }

  render() {
    if (this.state.loading){
      return(<Container> <CircularProgress color='primary' /></Container>)
    } else {
      return (
        <Container>
          <Grid container direction="row" spacing={1}>
            <Grid item  xs={12} sm={6} >
              <Paper style={{padding:5, flexGrow: 1, height: '300px'}}>
                <Typography variant='h5'>
                  Summary
                </Typography>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Portfolio type: </Typography>
                  <Typography variant='body1'> {this.props.portfolio_type ? 'REAL' : 'DEMO'} </Typography>
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
                  <Typography variant='body1'> Cash: </Typography>
                  <Typography variant='body1'> {this.total_cash().toLocaleString(undefined, {maximumFractionDigits: 2 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Investments: </Typography>
                  <Typography variant='body1'> {this.total_investment().toLocaleString(undefined, {maximumFractionDigits: 2 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Latent P&L: </Typography>
                  <Typography variant='body1' style={{color: this.total_pl() > 0 ? 'green' : 'red'}}>{this.performance_to_date() > 0 && '+'}{this.total_pl().toLocaleString(undefined, {maximumFractionDigits: 2 })} </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Total balance: </Typography>
                  <Typography variant='body1'> {(this.total_pl() + this.total_cash() + this.total_investment()).toLocaleString(undefined, {maximumFractionDigits: 2 }) } </Typography>
                </Grid>
                <Grid container justify='space-between'>
                  <Typography variant='body1'> Initial balance: </Typography>
                  <Typography variant='body1'> {(this.initial_balance()).toLocaleString(undefined, {maximumFractionDigits: 2 }) } </Typography>
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
            
            <Grid item xs={12} sm={12} >
              <Paper style={{padding:5}}>
              <Typography variant='h5' style={{display: 'inline-block', padding:5}}> Portfolio </Typography>
                {this.renderPortfolio()}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper style={{padding:5}}>
              <Typography variant='h5' style={{display: 'inline-block', padding: 5}}> Buy orders </Typography>
                {this.renderBuyOrders()}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper style={{padding:5}}>
              <Typography variant='h5' style={{display: 'inline-block', padding: 5}}> Sell orders </Typography>
                {this.renderSellOrders()}
              </Paper>
            </Grid>
            
            </Grid>
        </Container>
      ); 
    }
  }
}

export default withStyles(styles, { withTheme: true })(Home);