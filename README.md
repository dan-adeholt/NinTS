# NinTS

A cycle-accurate NES emulator written in TypeScript that runs in the browser.

**[Try it live at nin-ts.vercel.app →](https://nin-ts.vercel.app/)**

NinTS passes 145 of 156 (about 93%) of the [TASVideos accuracy test ROMs](https://tasvideos.org/EmulatorResources/NESAccuracyTests) it is tested against, including every CPU and APU test. It supports the NROM, MMC1, UNROM, CNROM, MMC3 and AxROM mappers, which covers a large part of the NES library, and emulates the NTSC version of the console.

## Features

* **Cycle-accurate core.** The CPU, PPU and APU are stepped in lockstep, one CPU cycle at a time, including dummy reads/writes, interrupt timing and DMA cycle stealing.
* **Complete 6502 implementation**, including unofficial opcodes.
* **Low-latency audio** through an `AudioWorklet` fed by a lock-free ring buffer in a `SharedArrayBuffer`.
* **Input** from keyboard, gamepads (Gamepad API) and on-screen touch controls on mobile, with configurable bindings.
* **Save states and ROM library** stored locally in IndexedDB.
* **Built-in debuggers:** CPU disassembly with breakpoints and stepping, PPU name tables, sprites, OAM and VRAM viewers, APU channel viewer, and a trace logger that can be diffed against [Mesen](https://www.mesen.ca/) trace logs.
* **Automated accuracy testing** against public test ROMs, verified either through the test status at `$6000` or by comparing screen output to reference images.

## Getting started

Requires Node.js and Yarn.

```sh
git clone --recurse-submodules git@github.com:dan-adeholt/NinTS.git
cd NinTS
yarn install
yarn dev
```

Then open [http://localhost:5173](http://localhost:5173) and load a `.nes` ROM file from the menu or by dropping it on the page.

| Script | Description |
| --- | --- |
| `yarn dev` | Start the development server |
| `yarn build` | Type check and build for production |
| `yarn test` | Run the test suite (requires the `nes-test-roms` submodule) |
| `yarn lint` | Type check and lint |
| `yarn perfTest <rom>` | Run the performance benchmark, see [Performance](#performance) |

### Default controls

| NES | Keyboard |
| --- | --- |
| D-pad | W A S D |
| A | Space |
| B | M |
| Select | . |
| Start | - |

## Tech stack

TypeScript, React, Vite and Vitest. The emulator core is plain TypeScript with no framework dependencies.

## Architecture

The project is split into two parts. `src/emulator` contains the emulator core, which has no dependencies on React or the DOM and can run in Node. `src/components` and `src/hooks` contain the React UI.

The emulator core is driven one CPU cycle at a time:

* `EmulatorState` owns the machine: CPU registers, controllers, DMA and the memory map. Every CPU memory access goes through a read or write tick that advances the PPU by 3 cycles and the APU by 1, so all components stay in lockstep. Ticks are split into two phases so that NMI and IRQ edge detection happens at the right point within the cycle.
* `cpu.ts` decodes opcodes, including unofficial ones, and dispatches to the instruction implementations in `instructions/`. Addressing modes in `memory.ts` perform the same dummy reads and writes as the real 6502, which some test ROMs and games depend on.
* `ppu.ts` runs cycle by cycle and renders into a framebuffer, emulating background tile fetches, sprite evaluation, sprite zero hit and the scroll registers.
* `apu.ts` and `apu/` implement the two square channels, triangle, noise and DMC, including DMC DMA stealing cycles from the CPU.
* `mappers/` implement cartridge hardware, such as bank switching and scanline IRQs (MMC3).

The UI runs the emulator from `requestAnimationFrame` (`hooks/useGameLoop.ts`) and streams audio samples to an audio worklet (`hooks/useAudio.ts`).

## Performance

Cycle-accurate emulation is expensive: every CPU cycle steps the PPU three times and the APU once, which makes many common emulator optimizations impossible without losing accuracy. The core is written to be easy for the JIT to optimize, with no allocations in the hot path and simple, monomorphic code that V8 and JavaScriptCore compile to efficient machine code.

On an M1 MacBook Pro, NinTS uses around 40% of a single core.

### Benchmarking

Profiling an emulator in V8 is hard: lots of small functions run millions of times per second, and the sampling profiler easily misses hotspots. Instead, I use a dedicated benchmark, `yarn perfTest <path-to-rom>`, which runs 15 iterations of:

1. Warming up the emulator to make sure the JIT has kicked in
2. Running the CPU, PPU and APU separately
3. Running all three together
4. Printing the results

```
CPU     APU    PPU     TOTAL   CALC TOTAL
41.96   54.94  128.01  237.59  224.91
```

`CALC TOTAL` is CPU + APU + PPU. The real `TOTAL` is higher because of the extra cost of interleaving the components cycle by cycle.

## Accuracy

I used [Mesen](https://www.mesen.ca/) as the reference emulator during development. Most of the tests below run automatically as part of `yarn test`. They check either the result code that modern test ROMs write to `$6000`, or compare the screen output to a reference image (see `nes-test-images`).

| Category | Passed |
| --- | --- |
| APU tests | 40 / 40 |
| CPU tests | 50 / 50 |
| Mapper tests | 10 / 13 |
| PPU tests | 42 / 47 |
| Miscellaneous tests | 0 / 3 |
| Demos that depend on accuracy | 3 / 3 |
| **Total** | **145 / 156** |

<details>
<summary>Full test results</summary>

### APU tests

| Test ROM | Status |
| --- | --- |
| apu_mixer/dmc | ✅ Pass |
| apu_mixer/noise | ✅ Pass |
| apu_mixer/square | ✅ Pass |
| apu_mixer/triangle | ✅ Pass |
| apu_reset/4015_cleared | ✅ Pass |
| apu_reset/4017_timing | ✅ Pass |
| apu_reset/4017_written | ✅ Pass |
| apu_reset/irq_flag_cleared | ✅ Pass |
| apu_reset/len_ctrs_enabled | ✅ Pass |
| apu_reset/works_immediately | ✅ Pass |
| apu_test/rom_singles/1-len_ctr | ✅ Pass |
| apu_test/rom_singles/2-len_table | ✅ Pass |
| apu_test/rom_singles/3-irq_flag | ✅ Pass |
| apu_test/rom_singles/4-jitter | ✅ Pass |
| apu_test/rom_singles/5-len_timing | ✅ Pass |
| apu_test/rom_singles/6-irq_flag_timing | ✅ Pass |
| apu_test/rom_singles/7-dmc_basics | ✅ Pass |
| apu_test/rom_singles/8-dmc_rates | ✅ Pass |
| blargg_apu_2005.07.30/01.len_ctr | ✅ Pass |
| blargg_apu_2005.07.30/02.len_table | ✅ Pass |
| blargg_apu_2005.07.30/03.irq_flag | ✅ Pass |
| blargg_apu_2005.07.30/04.clock_jitter | ✅ Pass |
| blargg_apu_2005.07.30/05.len_timing_mode0 | ✅ Pass |
| blargg_apu_2005.07.30/06.len_timing_mode1 | ✅ Pass |
| blargg_apu_2005.07.30/07.irq_flag_timing | ✅ Pass |
| blargg_apu_2005.07.30/08.irq_timing | ✅ Pass |
| blargg_apu_2005.07.30/09.reset_timing | ✅ Pass |
| blargg_apu_2005.07.30/10.len_halt_timing | ✅ Pass |
| blargg_apu_2005.07.30/11.len_reload_timing | ✅ Pass |
| dmc_dma_during_read4/dma_2007_read | ✅ Pass |
| dmc_dma_during_read4/dma_2007_write | ✅ Pass |
| dmc_dma_during_read4/dma_4016_read | ✅ Pass |
| dmc_dma_during_read4/double_2007_read | ✅ Pass |
| dmc_dma_during_read4/read_write_2007 | ✅ Pass |
| dmc_tests/buffer_retained | ✅ Pass |
| dmc_tests/latency | ✅ Pass |
| dmc_tests/status_irq | ✅ Pass |
| dmc_tests/status | ✅ Pass |
| dpcmletterbox/dpcmletterbox | ✅ Pass |
| volume_tests/volumes | ✅ Pass |

### CPU tests

| Test ROM | Status |
| --- | --- |
| blargg_nes_cpu_test5/cpu | ✅ Pass |
| blargg_nes_cpu_test5/official | ✅ Pass |
| branch_timing_tests/1.Branch_Basics | ✅ Pass |
| branch_timing_tests/2.Backward_Branch | ✅ Pass |
| branch_timing_tests/3.Forward_Branch | ✅ Pass |
| cpu_dummy_reads/cpu_dummy_reads | ✅ Pass |
| cpu_dummy_writes/cpu_dummy_writes_oam | ✅ Pass |
| cpu_dummy_writes/cpu_dummy_writes_ppumem | ✅ Pass |
| cpu_exec_space/test_cpu_exec_space_apu | ✅ Pass |
| cpu_exec_space/test_cpu_exec_space_ppuio | ✅ Pass |
| cpu_interrupts_v2/cpu_interrupts | ✅ Pass |
| cpu_interrupts_v2/rom_singles/1-cli_latency | ✅ Pass |
| cpu_interrupts_v2/rom_singles/2-nmi_and_brk | ✅ Pass |
| cpu_interrupts_v2/rom_singles/3-nmi_and_irq | ✅ Pass |
| cpu_interrupts_v2/rom_singles/4-irq_and_dma | ✅ Pass |
| cpu_interrupts_v2/rom_singles/5-branch_delays_irq | ✅ Pass |
| cpu_reset/ram_after_reset | ✅ Pass |
| cpu_reset/registers | ✅ Pass |
| cpu_timing_test6/cpu_timing_test | ✅ Pass |
| instr_misc/instr_misc | ✅ Pass |
| instr_test-v3/rom_singles/01-implied | ✅ Pass |
| instr_test-v3/rom_singles/02-immediate | ✅ Pass |
| instr_test-v3/rom_singles/03-zero_page | ✅ Pass |
| instr_test-v3/rom_singles/04-zp_xy | ✅ Pass |
| instr_test-v3/rom_singles/05-absolute | ✅ Pass |
| instr_test-v3/rom_singles/06-abs_xy | ✅ Pass |
| instr_test-v3/rom_singles/07-ind_x | ✅ Pass |
| instr_test-v3/rom_singles/08-ind_y | ✅ Pass |
| instr_test-v3/rom_singles/09-branches | ✅ Pass |
| instr_test-v3/rom_singles/10-stack | ✅ Pass |
| instr_test-v3/rom_singles/11-jmp_jsr | ✅ Pass |
| instr_test-v3/rom_singles/12-rts | ✅ Pass |
| instr_test-v3/rom_singles/13-rti | ✅ Pass |
| instr_test-v3/rom_singles/14-brk | ✅ Pass |
| instr_test-v3/rom_singles/15-special | ✅ Pass |
| instr_test-v3/all_instrs | ✅ Pass |
| instr_test-v3/official_only | ✅ Pass |
| instr_timing/instr_timing | ✅ Pass |
| other/nestest | ✅ Pass |
| nes_instr_test/rom_singles/01-implied | ✅ Pass |
| nes_instr_test/rom_singles/02-immediate | ✅ Pass |
| nes_instr_test/rom_singles/03-zero_page | ✅ Pass |
| nes_instr_test/rom_singles/04-zp_xy | ✅ Pass |
| nes_instr_test/rom_singles/05-absolute | ✅ Pass |
| nes_instr_test/rom_singles/06-abs_xy | ✅ Pass |
| nes_instr_test/rom_singles/07-ind_x | ✅ Pass |
| nes_instr_test/rom_singles/08-ind_y | ✅ Pass |
| nes_instr_test/rom_singles/09-branches | ✅ Pass |
| nes_instr_test/rom_singles/10-stack | ✅ Pass |
| nes_instr_test/rom_singles/11-special | ✅ Pass |

### Mapper tests

| Test ROM | Status |
| --- | --- |
| exram/mmc5exram | ❌ Fail |
| mmc3_irq_tests/1.Clocking | ✅ Pass |
| mmc3_irq_tests/2.Details | ✅ Pass |
| mmc3_irq_tests/3.A12_clocking | ✅ Pass |
| mmc3_irq_tests/4.Scanline_timing | ✅ Pass |
| mmc3_irq_tests/5.MMC3_rev_A | ❌ Fail |
| mmc3_irq_tests/6.MMC3_rev_B | ✅ Pass |
| mmc3_test/1-clocking | ✅ Pass |
| mmc3_test/2-details | ✅ Pass |
| mmc3_test/3-A12_clocking | ✅ Pass |
| mmc3_test/4-scanline_timing | ✅ Pass |
| mmc3_test/5-MMC3 | ✅ Pass |
| mmc3_test/6-MMC6 | ❌ Fail |

### PPU tests

| Test ROM | Status |
| --- | --- |
| blargg_ppu_tests_2005.09.15b/palette_ram | ✅ Pass |
| blargg_ppu_tests_2005.09.15b/power_up_palette | ✅ Pass |
| blargg_ppu_tests_2005.09.15b/sprite_ram | ✅ Pass |
| blargg_ppu_tests_2005.09.15b/vbl_clear_time | ✅ Pass |
| blargg_ppu_tests_2005.09.15b/vram_access | ✅ Pass |
| nmi_sync/demo_ntsc | ✅ Pass |
| oam_read/oam_read | ✅ Pass |
| oam_stress/oam_stress | ❌ Fail |
| ppu_open_bus/ppu_open_bus | ❌ Fail |
| ppu_vbl_nmi/rom_singles/01-vbl_basics | ✅ Pass |
| ppu_vbl_nmi/rom_singles/02-vbl_set_time | ✅ Pass |
| ppu_vbl_nmi/rom_singles/03-vbl_clear_time | ✅ Pass |
| ppu_vbl_nmi/rom_singles/04-nmi_control | ✅ Pass |
| ppu_vbl_nmi/rom_singles/05-nmi_timing | ✅ Pass |
| ppu_vbl_nmi/rom_singles/06-suppression | ✅ Pass |
| ppu_vbl_nmi/rom_singles/07-nmi_on_timing | ✅ Pass |
| ppu_vbl_nmi/rom_singles/08-nmi_off_timing | ✅ Pass |
| ppu_vbl_nmi/rom_singles/09-even_odd_frames | ✅ Pass |
| ppu_vbl_nmi/rom_singles/10-even_odd_timing | ✅ Pass |
| scanline/scanline | ✅ Pass |
| scrolltest/scroll | ✅ Pass |
| sprdma_and_dmc_dma/sprdma_and_dmc_dma_512 | ✅ Pass |
| sprdma_and_dmc_dma/sprdma_and_dmc_dma | ✅ Pass |
| sprite_hit_tests_2005.10.05/01.basics | ✅ Pass |
| sprite_hit_tests_2005.10.05/02.alignment | ✅ Pass |
| sprite_hit_tests_2005.10.05/03.corners | ✅ Pass |
| sprite_hit_tests_2005.10.05/04.flip | ✅ Pass |
| sprite_hit_tests_2005.10.05/05.left_clip | ✅ Pass |
| sprite_hit_tests_2005.10.05/06.right_edge | ✅ Pass |
| sprite_hit_tests_2005.10.05/07.screen_bottom | ✅ Pass |
| sprite_hit_tests_2005.10.05/08.double_height | ✅ Pass |
| sprite_hit_tests_2005.10.05/09.timing_basics | ✅ Pass |
| sprite_hit_tests_2005.10.05/10.timing_order | ✅ Pass |
| sprite_hit_tests_2005.10.05/11.edge_timing | ✅ Pass |
| sprite_overflow_tests/1.Basics | ✅ Pass |
| sprite_overflow_tests/2.Details | ✅ Pass |
| sprite_overflow_tests/3.Timing | ❌ Fail |
| sprite_overflow_tests/4.Obscure | ❌ Fail |
| sprite_overflow_tests/5.Emulator | ✅ Pass |
| tvpassfail/tv | ❌ Fail |
| vbl_nmi_timing/1.frame_basics | ✅ Pass |
| vbl_nmi_timing/2.vbl_timing | ✅ Pass |
| vbl_nmi_timing/3.even_odd_frames | ✅ Pass |
| vbl_nmi_timing/4.vbl_clear_timing | ✅ Pass |
| vbl_nmi_timing/5.nmi_suppression | ✅ Pass |
| vbl_nmi_timing/6.nmi_disable | ✅ Pass |
| vbl_nmi_timing/7.nmi_timing | ✅ Pass |

### Miscellaneous tests

| Test ROM | Status |
| --- | --- |
| PaddleTest3/PaddleTest | ❌ Fail |
| read_joy3/test_buttons | ❌ Fail |
| read_joy3/thorough_test | ❌ Fail |

### Demos that depend on accuracy

| Test ROM | Status |
| --- | --- |
| full_palette/flowing_palette | ✅ Pass |
| full_palette/full_palette_smooth | ✅ Pass |
| full_nes_palette | ✅ Pass |

</details>

## Roadmap

* More accurate sprite overflow emulation
* More mappers
* Better audio resampling, for example a TypeScript port of [blip_buf](https://code.google.com/archive/p/blip-buf/). The current approach averages samples, which works but leaves some artifacts
* Stereo output with panning
* PAL support

## License

[MIT](LICENSE.md)
