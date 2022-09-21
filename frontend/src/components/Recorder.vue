<template>
  <div id="recorder">
      <div class="container">
          <div class="row">
              <div class="col-md-6">
                  <div class="well">
                      <form>
                          <div class="form-group">
                              <label for="firstname">First Name</label>
                              <input type="text" v-model="input.person.firstname" class="form-control" id="firstname" placeholder="First Name">
                          </div>
                          <div class="form-group">
                              <label for="lastname">Last Name</label>
                              <input type="text" v-model="input.person.lastname" class="form-control" id="lastname" placeholder="Last Name">
                          </div>
                          <button type="button" v-on:click="createPerson()" class="btn btn-default">Save</button>
                      </form>
                  </div>
              </div>
              <div class="col-md-6">
                  <div class="well">
                      <form>
                          <div class="form-group">
                              <label for="city">City</label>
                              <input type="text" v-model="input.address.city" class="form-control" id="city" placeholder="City">
                          </div>
                          <div class="form-group">
                              <label for="state">State</label>
                              <input type="text" v-model="input.address.state" class="form-control" id="state" placeholder="State">
                          </div>
                          <button type="button" v-on:click="createAddress()" class="btn btn-default">Save</button>
                      </form>
                  </div>
              </div>
          </div>
          <div class="row">
              <div class="col-md-12">
                  <ul class="list-group">
                      <li v-for="person in people" :key="person.id" class="list-group-item">
                          {{ person.firstname }} {{ person.lastname }} -
                          <span v-for="(address) in person.addresses" :key="address.id" >
                              {{ address.city }}, {{ address.state }} /
                          </span>
                          <div>
                              <form>
                                  <div v-for="(address) in addresses" :key="address.id" >
                                      <input type="radio" name="addressid" v-bind:value="address.id" v-model="input.addressid"> {{ address.city }}, {{ address.state }}
                                  </div>
                                  <button type="button" v-on:click="linkAddress(person.id)" class="btn btn-default">Save</button>
                              </form>
                          </div>
                      </li>
                  </ul>
              </div>
          </div>
      </div>
  </div>
</template>

<script>
import axios from 'axios'
const production = true
const apiAddress = (production ? 'http://127.0.0.1:5400' : 'http://localhost:5400')

export default {
  name: 'Recorder',
  data () {
    return {
      input: {
        person: {
          firstname: '',
          lastname: ''
        },
        address: {
          city: '',
          state: ''
        },
        addressid: ''
      },
      people: [],
      addresses: []
    }
  },
  mounted () {
    axios({ method: 'GET', url: apiAddress + '/people' })
      .then((result) => {
        this.people = result.data || []
      })
      .catch(() => {
        this.people = []
      })

    axios({ method: 'GET', url: apiAddress + '/addresses' })
      .then((result) => {
        this.addresses = result.data || []
      })
      .catch(() => {
        this.addresses = []
      })
  },
  methods: {
    createPerson () {
      if (this.input.person.firstname !== '' && this.input.person.lastname !== '') {
        axios({
          method: 'POST',
          url: apiAddress + '/person',
          data: this.input.person,
          headers: { 'content-type': 'application/json' }
        })
          .then((result) => {
            if (!this.people) {
              this.people = []
            }
            this.people.push(result.data)
            this.input.person.firstname = ''
            this.input.person.lastname = ''
          })
          .catch(() => {})
      }
    },
    createAddress () {
      if (this.input.address.city !== '' && this.input.address.state !== '') {
        axios({
          method: 'POST',
          url: apiAddress + '/address',
          data: this.input.address,
          headers: { 'content-type': 'application/json' }
        })
          .then((result) => {
            if (!this.addresses) {
              this.addresses = []
            }
            this.addresses.push(result.data)
            this.input.address.city = ''
            this.input.address.state = ''
          })
          .catch(() => {})
      }
    },
    linkAddress (personid) {
      if (this.input.addressid !== undefined && personid !== '') {
        axios({
          method: 'PUT',
          url: apiAddress + '/person/address/' + personid,
          data: { addressid: this.input.addressid },
          headers: { 'content-type': 'application/json' }
        })
          .then((result) => {
            for (let i = 0; i < this.people.length; i++) {
              if (this.people[i].id === personid) {
                if (this.people[i].addresses === undefined) {
                  this.people[i].addresses = []
                }
                axios({ method: 'GET', url: apiAddress + '/address/' + this.input.addressid })
                  .then((result) => {
                    this.people[i].addresses.push(result.data)
                    this.input.addressid = ''
                  })
                  .catch(() => {})
              }
            }
          })
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#recorder {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 30px;
}
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
