<template>
  <div id="app">
    <!-- <img src="./assets/logo.jpg"> -->
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #386f79;
  /* margin-top: 60px; */
}
body{
  margin: auto;
}
</style>
