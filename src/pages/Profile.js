import React from 'react';
import { TextField, Grid, Button } from '@material-ui/core';

class Profile extends React.Component {

  componentDidMount(){
      console.log(this.props)
      console.log(this.props.user)
  }

  render() {
    return (
        <Grid
            container
            spacing={2}
            direction='column'
            alignItems='center'
            style={{ minHeight: '100vh'}}
        >   
            <Grid container item xs={12} sm={4} md={4} lg={4} xl={4} >
                <TextField
                    // onChange={e => {this.props.handleChange(e);}}
                    defaultValue={this.props.user.username}
                    name="username"
                    variant="outlined"
                    fullWidth
                    required
                    id="Name"
                    label="Name"
                />
            </Grid>
            <Grid container item xs={12} sm={4} md={4} lg={4} xl={4} >
                <TextField
                    // onChange={e => {this.props.handleChange(e);}}
                    defaultValue={this.props.user.email}
                    name="email"
                    variant="outlined"
                    fullWidth
                    required
                    id="Email"
                    label="Email"
                />
            </Grid>
            <Grid container item xs={12} sm={4} md={4} lg={4} xl={4} >
                <TextField
                    // onChange={e => {this.props.handleChange(e);}}
                    defaultValue={this.props.user.password}
                    variant="outlined"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                />
            </Grid> 
        </Grid>
    ); 
  }
}

export default Profile