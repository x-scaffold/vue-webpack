<style>
.demo { margin-bottom: 20px; text-align: center; }
.demo-item { border: 1px solid #ddd; padding: 20px 0; margin: 0 10px; }
.img-wrap { display: block; }
.img-wrap > img { max-width: 100%; display: block; }
.img-css { width: 75px; height: 76px; background: url(~./assets/1.jpeg) no-repeat center center; background-size: cover; }
img { display: block; }
</style>
<style lang="less">
.less-flex {
  display: flex;
  &-item {
    flex: 1;
  }
}
</style>
<template>
  <div class="container">
    <div class="less-flex demo">
      <div class="less-flex-item demo-item">{{ msg }}</div>
      <div class="less-flex-item demo-item">{{ msg }}</div>
    </div>
    <div class="demo">
      <div class="img-wrap">
        <img src="./assets/1.jpeg">
      </div>
    </div>
    <div class="demo">
      <div class="img-css"></div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'App',
  data() {
    return {
      msg: 'hello x-scaffold',
    };
  },
  methods: {

  },
  computed: {

  },
  mounted() {

  },
};
</script>
