import React from 'react';
import { TextField, Grid, Button } from '@material-ui/core';


class Auth extends React.Component {

  render() {
    return (
        <Grid
            container
            spacing={2}
            direction="column"
            alignItems="center"
            justify="center"
            style={{ minHeight: '100vh' }}
        >   
            <Grid item xs={12}>
                <div style={{'color':'red'}}>
                    {this.props.errors.detail}
                </div>
            </Grid>
            
            <Grid item xs={12}>
                <TextField
                    onChange={e => {this.props.handleChange(e);}}
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
            <Grid item xs={12}>
                <TextField
                    onChange={e => {this.props.handleChange(e);}}
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
            <Grid item xs={12}>
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {this.props.login()}}
                >
                LOGIN
            </Button>
            </Grid>
        </Grid>
    ); 
  }
}

export default Auth