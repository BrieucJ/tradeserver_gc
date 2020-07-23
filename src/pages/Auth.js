import React from 'react';
import { TextField, Grid, Button, Typography } from '@material-ui/core';


class Auth extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            sign_up: false,
        };
      }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }

  render() {
    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            justify="center"
            style={{ minHeight: '100vh' }}
        >   
            <Grid item xs={10} style={{margin:10}}>
                <Typography style={{'color':'red'}}>
                    {this.props.errors.non_field_errors}
                </Typography>
            </Grid>
            
            <Grid item xs={10} style={{margin:10}}>
                <TextField
                    onChange={e => {this.handleChange(e);}}
                    name="username"
                    variant="outlined"
                    fullWidth
                    required
                    id="Name"
                    label="Name"
                    autoFocus
                    error={this.props.errors.username !== undefined}
                    helperText={this.props.errors.username}
                />
            </Grid>
            {this.state.sign_up && 
                <Grid item xs={10} style={{margin:10}}>
                    <TextField
                        onChange={e => {this.handleChange(e);}}
                        name="email"
                        variant="outlined"
                        fullWidth
                        required
                        id="email"
                        label="Email"
                        error={this.props.errors.email !== undefined}
                        helperText={this.props.errors.email}
                    />
                </Grid>
            }
            <Grid item xs={10} style={{margin:10}}>
                <TextField
                    onChange={e => {this.handleChange(e);}}
                    variant="outlined"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    error={this.props.errors.password !== undefined}
                    helperText={this.props.errors.password}
                />
            </Grid> 
            <Grid item xs={10} style={{margin:10}}>
                {this.state.sign_up &&
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {this.props.sign_up(this.state)}}
                >
                    Sign up
                </Button>
                }
                {!this.state.sign_up &&
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {this.props.log_in(this.state)}}
                >
                    Log in
                </Button>
                }
            </Grid>
            <Grid item xs={10} style={{margin:10}}>
                <Typography color='inherit' style={{cursor: 'pointer'}} onClick={()=>{this.setState({sign_up: !this.state.sign_up})}}>
                    {!this.state.sign_up && 'Sign up'}
                    {this.state.sign_up && 'Log in'}
                </Typography>
            </Grid>
        </Grid>
    ); 
  }
}

export default Auth