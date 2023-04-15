# NinTS

This is a cycle accurate NES emulator written in Typescript.

It is fairly accurate (it passes around 93% of TASVideos accuracy tests, see accuracy section). However, it has pretty basic mapper support (NROM, MMC1, UNROM, CNROM, MMC3 and AxROM) and only supports NTSC at the moment.

## Hosting

You can try out the emulator at [https://nin-ts.vercel.app/](https://nin-ts.vercel.app/)

## Development

Just run `yarn dev` to get started. The project uses React for the UI portion and Vite as the build system. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

Stuff in `src/emulator` should be completely React-free and only contain low level emulator code.

React components are located in `src/components`, hooks in `src/hooks`.

## Testing

Run `yarn test`. Make sure you run git submodule init before as the testing system relies on a subrepo that contains test roms.

## TODO / Goals

* Improve sprite overflow algorithm, current implementation is not accurate
* More mapper support
* Improve sound filtering, perhaps port blip-buf to Typescript. Right now I average sample values, it is better than just using the current value, but using something like blip-buf would reduce artifacts
* Implement stereo support (optional, with panning etc)
* Implement PAL support

I am not sure how much more time I will spend on this, I am fairly satisfied with the level of accuracy at the moment.


## Performance

Since it is a cycle accurate emulator it requires substantially more resources than a traditional emulator. It also suffers a performance penalty being written in Javascript, however not as large as one might imagine. I have deliberately kept the code as simple as possible with no allocations and V8 / JavascriptCore pretty efficiently JIT:s it to machine code.

On my M1 Macbook Pro it uses around 40% of a single core. Mesen, also a cycle accurate emulator written in C++, has around the same CPU usage on my machine. However, Mesen is more accurate than my emulator is. Even though NinTS is not far behind in terms of test roms Mesen has lots more special case handling for weird corner cases than NinTS does which affects performance.

I am tempted to translate the core emulator code into C++ to see exactly how much performance penalty there is.

Writing cycle accurate emulators is a bit awkward, it's hard to optimize it without affecting accuracy. There are tons of big optimizations that I could do that unfortunately destroys accuracy.

## Profiling

It is a bit hard to profile an emulator under V8. There are tons of small functions executed millions of times during a second and the profiler easily misses hotspots. The best results
I've gotten where obtained on Linux where I could use the native `prof` support.

However, now I mainly use a specific script called perfTest. It does 15 iterations of the following:

1) Warm up emulator for a certain number of cycles to ensure JIT is applied
2) Run separate simulations of APU, PPU, CPU
3) Run simulation of everything working together
4) Show results for a given run

Example:

```
CPU     APU    PPU     TOTAL   CALC TOTAL
41.96   54.94  128.01  237.59  224.91
```

`CALC TOTAL` is just CPU + APU + PPU. The real TOTAL is higher since there is a performance penalty when running the simulations "interleaved". Every time the CPU performs one cycle, the PPU is updated 3 cycles, and the APU is updated once.

Invoke the script by doing `yarn perfTest <path-to-rom>`.

When doing optimizations I just basically run this script repeatedly to judge the impact.

## Accuracy

I have used Mesen as a reference emulator. Most of these tests are automatically verified using a test suite. The tests either check the status in $6000 (modern test case roms) or by comparing the output to a reference image (see the nes-test-images folder for reference).

I will say that even though I have quite good accuracy according to these tests, Mesen has tons more fixes for edge case behaviors that are not easily captured by test roms. It is a lot more battle-tested, more accurate and has supports for lots more mappers and system variations.

| Test ROM | Status |
| ---------|--------|
| APU tests |
| apu_mixer/dmc |	Pass |
| apu_mixer/noise | Pass |
| apu_mixer/square | Pass |
| apu_mixer/triangle | Pass |
| apu_reset/4015_cleared | Pass |
| apu_reset/4017_timing | Pass |
| apu_reset/4017_written | Pass |
| apu_reset/irq_flag_cleared | Pass |
| apu_reset/len_ctrs_enabled | Pass |
| apu_reset/works_immediately | Pass |
| apu_test/rom_singles/1-len_ctr | Pass |
| apu_test/rom_singles/2-len_table | Pass |
| apu_test/rom_singles/3-irq_flag | Pass |
| apu_test/rom_singles/4-jitter | Pass |
| apu_test/rom_singles/5-len_timing | Pass |
| apu_test/rom_singles/6-irq_flag_timing | Pass |
| apu_test/rom_singles/7-dmc_basics | Pass |
| apu_test/rom_singles/8-dmc_rates | Pass |
| blargg_apu_2005.07.30/01.len_ctr | Pass |
| blargg_apu_2005.07.30/02.len_table | Pass |
| blargg_apu_2005.07.30/03.irq_flag | Pass |
| blargg_apu_2005.07.30/04.clock_jitter | Pass |
| blargg_apu_2005.07.30/05.len_timing_mode0 | Pass |
| blargg_apu_2005.07.30/06.len_timing_mode1 | Pass |
| blargg_apu_2005.07.30/07.irq_flag_timing | Pass |
| blargg_apu_2005.07.30/08.irq_timing | Pass |
| blargg_apu_2005.07.30/09.reset_timing | Pass |
| blargg_apu_2005.07.30/10.len_halt_timing | Pass |
| blargg_apu_2005.07.30/11.len_reload_timing | Pass |
| dmc_dma_during_read4/dma_2007_read | Pass |
| dmc_dma_during_read4/dma_2007_write | Pass |
| dmc_dma_during_read4/dma_4016_read | Pass |
| dmc_dma_during_read4/double_2007_read | Pass |
| dmc_dma_during_read4/read_write_2007 | Pass |
| dmc_tests/buffer_retained | Pass |
| dmc_tests/latency | Pass |
| dmc_tests/status_irq | Pass |
| dmc_tests/status | Pass |
| dpcmletterbox/dpcmletterbox | Pass |
| volume_tests/volumes | Pass |
| CPU tests	 |
| blargg_nes_cpu_test5/cpu | Pass |
| blargg_nes_cpu_test5/official | Pass |
| branch_timing_tests/1.Branch_Basics | Pass |
| branch_timing_tests/2.Backward_Branch | Pass |
| branch_timing_tests/3.Forward_Branch | Pass |
| cpu_dummy_reads/cpu_dummy_reads | Pass |
| cpu_dummy_writes/cpu_dummy_writes_oam | Pass |
| cpu_dummy_writes/cpu_dummy_writes_ppumem | Pass |
| cpu_exec_space/test_cpu_exec_space_apu | Pass |
| cpu_exec_space/test_cpu_exec_space_ppuio | Pass |
| cpu_interrupts_v2/cpu_interrupts | Pass |
| cpu_interrupts_v2/rom_singles/1-cli_latency | Pass |
| cpu_interrupts_v2/rom_singles/2-nmi_and_brk | Pass |
| cpu_interrupts_v2/rom_singles/3-nmi_and_irq | Pass |
| cpu_interrupts_v2/rom_singles/4-irq_and_dma | Pass |
| cpu_interrupts_v2/rom_singles/5-branch_delays_irq | Pass |
| cpu_reset/ram_after_reset | Pass |
| cpu_reset/registers | Pass |
| cpu_timing_test6/cpu_timing_test | Pass |
| instr_misc/instr_misc | Pass |
| instr_test-v3/rom_singles/01-implied | Pass |
| instr_test-v3/rom_singles/02-immediate | Pass |
| instr_test-v3/rom_singles/03-zero_page | Pass |
| instr_test-v3/rom_singles/04-zp_xy | Pass |
| instr_test-v3/rom_singles/05-absolute | Pass |
| instr_test-v3/rom_singles/06-abs_xy | Pass |
| instr_test-v3/rom_singles/07-ind_x | Pass |
| instr_test-v3/rom_singles/08-ind_y | Pass |
| instr_test-v3/rom_singles/09-branches | Pass |
| instr_test-v3/rom_singles/10-stack | Pass |
| instr_test-v3/rom_singles/11-jmp_jsr | Pass |
| instr_test-v3/rom_singles/12-rts | Pass |
| instr_test-v3/rom_singles/13-rti | Pass |
| instr_test-v3/rom_singles/14-brk | Pass |
| instr_test-v3/rom_singles/15-special | Pass |
| instr_test-v3/all_instrs | Pass |
| instr_test-v3/official_only | Pass |
| instr_timing/instr_timing | Pass |
| other/nestest | Pass |
| nes_instr_test/rom_singles/01-implied | Pass |
| nes_instr_test/rom_singles/02-immediate | Pass |
| nes_instr_test/rom_singles/03-zero_page | Pass |
| nes_instr_test/rom_singles/04-zp_xy | Pass |
| nes_instr_test/rom_singles/05-absolute | Pass |
| nes_instr_test/rom_singles/06-abs_xy | Pass |
| nes_instr_test/rom_singles/07-ind_x | Pass |
| nes_instr_test/rom_singles/08-ind_y | Pass |
| nes_instr_test/rom_singles/09-branches | Pass |
| nes_instr_test/rom_singles/10-stack | Pass |
| nes_instr_test/rom_singles/11-special | Pass |
| Mapper-specific | tests	 |
| exram/mmc5exram | Fail |
| mmc3_irq_tests/1.Clocking | Pass |
| mmc3_irq_tests/2.Details | Pass |
| mmc3_irq_tests/3.A12_clocking | Pass |
| mmc3_irq_tests/4.Scanline_timing | Pass |
| mmc3_irq_tests/5.MMC3_rev_A | Fail |
| mmc3_irq_tests/6.MMC3_rev_B | Pass |
| mmc3_test/1-clocking | Pass |
| mmc3_test/2-details | Pass |
| mmc3_test/3-A12_clocking | Pass |
| mmc3_test/4-scanline_timing | Pass |
| mmc3_test/5-MMC3 | Pass |
| mmc3_test/6-MMC6 | Fail |
| PPU/graphics |  |
| blargg_ppu_tests_2005.09.15b/palette_ram | Pass |
| blargg_ppu_tests_2005.09.15b/power_up_palette | Pass |
| blargg_ppu_tests_2005.09.15b/sprite_ram | Pass |
| blargg_ppu_tests_2005.09.15b/vbl_clear_time | Pass |
| blargg_ppu_tests_2005.09.15b/vram_access | Pass |
| nmi_sync/demo_ntsc | Pass |
| oam_read/oam_read | Pass |
| oam_stress/oam_stress | Fail |
| ppu_open_bus/ppu_open_bus | Fail |
| ppu_vbl_nmi/rom_singles/01-vbl_basics | Pass |
| ppu_vbl_nmi/rom_singles/02-vbl_set_time | Pass |
| ppu_vbl_nmi/rom_singles/03-vbl_clear_time | Pass |
| ppu_vbl_nmi/rom_singles/04-nmi_control | Pass |
| ppu_vbl_nmi/rom_singles/05-nmi_timing | Pass |
| ppu_vbl_nmi/rom_singles/06-suppression | Pass |
| ppu_vbl_nmi/rom_singles/07-nmi_on_timing | Pass |
| ppu_vbl_nmi/rom_singles/08-nmi_off_timing | Pass |
| ppu_vbl_nmi/rom_singles/09-even_odd_frames | Pass |
| ppu_vbl_nmi/rom_singles/10-even_odd_timing | Pass |
| scanline/scanline | Pass |
| scrolltest/scroll | Pass |
| sprdma_and_dmc_dma/sprdma_and_dmc_dma_512 | Pass |
| sprdma_and_dmc_dma/sprdma_and_dmc_dma | Pass |
| sprite_hit_tests_2005.10.05/01.basics | Pass |
| sprite_hit_tests_2005.10.05/02.alignment | Pass |
| sprite_hit_tests_2005.10.05/03.corners | Pass |
| sprite_hit_tests_2005.10.05/04.flip | Pass |
| sprite_hit_tests_2005.10.05/05.left_clip | Pass |
| sprite_hit_tests_2005.10.05/06.right_edge | Pass |
| sprite_hit_tests_2005.10.05/07.screen_bottom | Pass |
| sprite_hit_tests_2005.10.05/08.double_height | Pass |
| sprite_hit_tests_2005.10.05/09.timing_basics | Pass |
| sprite_hit_tests_2005.10.05/10.timing_order | Pass |
| sprite_hit_tests_2005.10.05/11.edge_timing | Pass |
| sprite_overflow_tests/1.Basics | Pass |
| sprite_overflow_tests/2.Details | Pass |
| sprite_overflow_tests/3.Timing | Fail |
| sprite_overflow_tests/4.Obscure | Fail |
| sprite_overflow_tests/5.Emulator | Pass |
| tvpassfail/tv | Fail |
| vbl_nmi_timing/1.frame_basics | Pass |
| vbl_nmi_timing/2.vbl_timing | Pass |
| vbl_nmi_timing/3.even_odd_frames | Pass |
| vbl_nmi_timing/4.vbl_clear_timing | Pass |
| vbl_nmi_timing/5.nmi_suppression | Pass |
| vbl_nmi_timing/6.nmi_disable | Pass |
| vbl_nmi_timing/7.nmi_timing | Pass |
| Miscellaneous | tests	 |
| PaddleTest3/PaddleTest | Fail |
| read_joy3/test_buttons | Fail |
| read_joy3/thorough_test | Fail |
| Demos that require accuracy	 |
| full_palette/flowing_palette | Pass |
| full_palette/full_palette_smooth | Pass |
| full_nes_palette | Pass |
