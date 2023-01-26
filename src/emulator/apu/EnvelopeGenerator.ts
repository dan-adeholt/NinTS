class EnvelopeGenerator {
  envelopeStartFlag = false;
  envelopeDividerPeriod = 0;
  decayLevelCounter = 15;
  envelopePeriod = 0;
  envelopeLoop = false;

  update() {
    if (this.envelopeStartFlag) {
      this.envelopeStartFlag = false;
      this.envelopeDividerPeriod = this.envelopePeriod;
      this.decayLevelCounter = 15;
    } else {
      this.envelopeDividerPeriod--;

      if (this.envelopeDividerPeriod <= 0) {
        this.envelopeDividerPeriod = this.envelopePeriod;

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
