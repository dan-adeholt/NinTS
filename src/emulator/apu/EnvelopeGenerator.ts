class EnvelopeGenerator {
  envelopeStartFlag = false;
  envelopeDividerPeriod = 0;
  decayLevelCounter = 15;
  envelopePeriodOrVolume = 0;
  envelopeLoop = false;
  constantVolume = false;

  update() {
    if (this.envelopeStartFlag) {
      this.envelopeStartFlag = false;
      this.envelopeDividerPeriod = this.envelopePeriodOrVolume;
      this.decayLevelCounter = 15;
    } else {
      this.envelopeDividerPeriod--;

      if (this.envelopeDividerPeriod <= 0) {
        this.envelopeDividerPeriod = this.envelopePeriodOrVolume;

        if (this.decayLevelCounter > 0) {
          this.decayLevelCounter--;
        } else if (this.envelopeLoop) {
          this.decayLevelCounter = 15;
        }
      }
    }
  }
}

export default EnvelopeGenerator;
