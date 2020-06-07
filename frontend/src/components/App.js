import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import {get} from '../utils/Api'
import {Container, Checkbox, List, ListItem, ListItemIcon, ListItemText} from '@material-ui/core'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      ticker_list: [],
      selected_tickers: [],
      prices: {}
    };
  }

  componentDidMount = async () => {
    get('stocks/').then((resp) => {
      this.setState({ticker_list: resp})
    })
  }

  getPriceHistory = async (symbol) => {
    get('pricehistorys/?symbol=' + symbol).then((resp) => {
      var prices = this.state.prices;
      prices[symbol] = resp  
      this.setState({prices: prices});
    })
  }

  handleSelection(symbol){
    console.log(symbol)
    var selected_tickers = [...this.state.selected_tickers]
    console.log(selected_tickers)
    const currentIndex = selected_tickers.indexOf(symbol)
    if (currentIndex === -1) {
      this.setState({selected_tickers: [...selected_tickers, symbol]})
      this.getPriceHistory(symbol)
    } else {
      this.setState({selected_tickers: selected_tickers.splice(currentIndex, 1)})
    }
  }

  renderLineChart(){
    var prices_tickers = Object.keys(this.state.prices)
    // for (let i = 0; i < prices_tickers.length; i++) {
    //   const element = prices_tickers[i];
    // }
    console.log(prices_tickers.length)
    console.log(this.state.prices[prices_tickers[0]])
    if (prices_tickers.length !== 0) {
      return(
        <Container>
          <LineChart width={600} height={300} data={this.state.prices[prices_tickers[0]]}>
            <Line type="monotone" dataKey="close" stroke="#8884d8" />
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="price_date" />
            <YAxis />
          </LineChart>
        </Container>
      )
    }
  }


  render() {
    return (
      <Container>
      <List>
      {this.state.ticker_list.map((value) => {
        return (
          <ListItem key={value.symbol} role={undefined} dense button onClick={() => {this.handleSelection(value.symbol)}}>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={this.state.selected_tickers.indexOf(value.symbol) !== -1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText id={value.symbol} primary={value.symbol} />
          </ListItem>
        );
      })}
      </List>
      {this.renderLineChart()}
      </Container>
    ); 
  }
}

export default App