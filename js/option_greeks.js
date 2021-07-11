
var spot = 15815,
strike = 14950,
expiry = '2021-07-12 23:59:00',
volt = 18,
int_rate = 7,
div_yld = 0;

//Validation
var error=null;

expiry = expiry.replace(" ", "T");

var date_expiry = new Date(expiry),
    date_now = new Date();

var seconds = Math.floor((date_expiry - (date_now))/1000),
    minutes = Math.floor(seconds/60),
    hours = Math.floor(minutes/60),
    delta_t = (Math.floor(hours/24))/365.0;

var volt = volt/100,
    int_rate = int_rate/100;

if(hours < 24) {
    error = "Please select a later date and time <br> Expiry should be minimum 24 hours from now";
    console.error(error)
}
else {

    var d1 = (Math.log(spot/strike) + (int_rate + Math.pow(volt,2)/2) * delta_t) / (volt*Math.sqrt(delta_t)),
        d2 = (Math.log(spot/strike) + (int_rate - Math.pow(volt,2)/2) * delta_t) / (volt*Math.sqrt(delta_t));

    var fv_strike = (strike)*Math.exp(-1*int_rate*delta_t);

    //For calculating CDF and PDF using gaussian library
    var distribution = gaussian(0, 1);


    //Premium Price
    var call_premium = spot * distribution.cdf(d1) - fv_strike * distribution.cdf(d2),
        put_premium = fv_strike * distribution.cdf(-1*d2) - spot * distribution.cdf(-1*d1);

    //Option greeks
    var call_delta = distribution.cdf(d1),
        put_delta = call_delta-1;

    var call_gamma = distribution.pdf(d1)/(spot*volt*Math.sqrt(delta_t)),
        put_gamma = call_gamma; 

    var call_vega = spot*distribution.pdf(d1)*Math.sqrt(delta_t)/100,
        put_vega = call_vega;

    var call_theta = (-1*spot*distribution.pdf(d1)*volt/(2*Math.sqrt(delta_t)) - int_rate*fv_strike*distribution.cdf(d2))/365,
        put_theta = (-1*spot*distribution.pdf(d1)*volt/(2*Math.sqrt(delta_t)) + int_rate*fv_strike*distribution.cdf(-1*d2))/365;

    var call_rho = fv_strike*delta_t*distribution.cdf(d2)/100,
        put_rho = -1*fv_strike*delta_t*distribution.cdf(-1*d2)/100;
    
        console.dir(call_premium.toFixed(2));
        console.dir(put_premium.toFixed(2));
        console.dir(call_delta.toFixed(3));
        console.dir(put_delta.toFixed(3));
        console.dir(call_gamma.toFixed(4));
        console.dir(call_theta.toFixed(3));
        console.dir(put_theta.toFixed(3));
        console.dir(call_rho.toFixed(3));
        console.dir(put_rho.toFixed(3));
        console.dir(call_vega.toFixed(3));
    
    // Colouring the numbers
    $("#results .results-value").removeClass('negative positive zero');

    $("#results .results-value").filter(function() {						
            return ($(this).text() == 0);
    }).addClass('zero');
    
    $("#results .results-value").filter(function() {						
            return ($(this).text() < 0);
    }).addClass('negative');

    $("#results .results-value").filter(function() {						
            return ($(this).text() > 0);
    }).addClass('positive');

}


(function(exports){

    // Complementary error function
    // From Numerical Recipes in C 2e p221
    var erfc = function(x) {
      var z = Math.abs(x);
      var t = 1 / (1 + z / 2);
      var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 +
              t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
              t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
              t * (-0.82215223 + t * 0.17087277)))))))))
      return x >= 0 ? r : 2 - r;
    };
  
    // Inverse complementary error function
    // From Numerical Recipes 3e p265
    var ierfc = function(x) {
      if (x >= 2) { return -100; }
      if (x <= 0) { return 100; }
  
      var xx = (x < 1) ? x : 2 - x;
      var t = Math.sqrt(-2 * Math.log(xx / 2));
  
      var r = -0.70711 * ((2.30753 + t * 0.27061) /
              (1 + t * (0.99229 + t * 0.04481)) - t);
  
      for (var j = 0; j < 2; j++) {
        var err = erfc(r) - xx;
        r += err / (1.12837916709551257 * Math.exp(-(r * r)) - r * err);
      }
  
      return (x < 1) ? r : -r;
    };
  
    // Construct a new distribution from the precision and precisionmean
    var fromPrecisionMean = function(precision, precisionmean) {
      return gaussian(precisionmean/precision, 1/precision);
    };
  
    // Models the normal distribution
    var Gaussian = function(mean, variance) {
      if (variance <= 0) {
        throw new Error('Variance must be > 0 (but was ' + variance + ')');
      }
      this.mean = mean;
      this.variance = variance;
      this.standardDeviation = Math.sqrt(variance);
    }
    // Probability density function
    Gaussian.prototype.pdf = function(x) {
      var m = this.standardDeviation * Math.sqrt(2 * Math.PI);
      var e = Math.exp(-Math.pow(x - this.mean, 2) / (2 * this.variance));
      return e / m;
    };
    // Cumulative density function
    Gaussian.prototype.cdf = function(x) {
      return 0.5 * erfc(-(x - this.mean) / (this.standardDeviation * Math.sqrt(2)));
    };
    // Add distribution of this and d
    Gaussian.prototype.add = function(d) {
      return gaussian(this.mean + d.mean, this.variance + d.variance);
    };
    // Subtract distribution of this and d
    Gaussian.prototype.sub = function(d) {
      return gaussian(this.mean - d.mean, this.variance + d.variance);
    };
    // Scales this distribution by constant c
    Gaussian.prototype.scale = function(c) {
      return gaussian(this.mean*c, this.variance*c*c);
    };
    Gaussian.prototype.mul = function(d) {
      if(typeof(d)==="number"){ return this.scale(d); }
      var precision = 1/this.variance;
      var dprecision = 1/d.variance;
      return fromPrecisionMean(precision+dprecision, 
        precision*this.mean+dprecision*d.mean);
    };
    Gaussian.prototype.div = function(d) {
      if(typeof(d)==="number"){ return this.scale(1/d); }
      var precision = 1/this.variance;
      var dprecision = 1/d.variance;
      return fromPrecisionMean(precision-dprecision, 
        precision*this.mean-dprecision*d.mean);
    };
    Gaussian.prototype.ppf = function(x) {
      return this.mean - this.standardDeviation * Math.sqrt(2) * ierfc(2 * x);
    };
    var gaussian = function(mean, variance){ return new Gaussian(mean, variance); };
    exports(gaussian);
  })(typeof(exports)==='undefined'? function(f){this['gaussian']=f} : function(f){module.exports=f});

