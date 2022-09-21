import Vue from 'vue'
import Recorder from '@/components/Recorder'

describe('Recorder.vue', () => {
  it('should render correct contents', () => {
    const Constructor = Vue.extend(Recorder)
    const vm = new Constructor().$mount()
    expect(vm.$el.querySelector('.recorder label').textContent)
      .toEqual('First Name')
  })
})
