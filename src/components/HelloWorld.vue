<template>
  <div class="hello">
    <h1 class="title-wc" >{{ msg }}</h1>
    <el-button class="title-bt-start" type="primary"  @click="handleGoPage()">开启视频通话</el-button>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: '欢迎来到 XLine 星连'
    }
  },
  methods: {
    handleGoPage () {
      // this.$emit('returnMainApp')
      this.$router.push(
        { path: '/Myvue'
        })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.hello{
  background-image:url("../assets/xline.jpg");
  /* width: 100%; */
  height: 1200px;
}
.title-wc{
  margin: auto;
  position: relative;
  top: 40%;
  color: #ffebcd;
}
.title-bt-start{
  position: relative;
  top: 50%;
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
