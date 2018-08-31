function counts() {
     this.count = 30;
    $('#times').html(this.count + "<i>秒</i>");
    var t = setInterval(function () {
        this.count--;
        if (this.count < 10) {
            $('#times').html("0" + this.count + "<i>秒</i>");
        } else {
            $('#times').html(this.count + "<i>秒</i>");
        }

        if (this.count == 0) {
            clearInterval(t);
            gameMonitor.stop();
            $('#gameoverPanel').hide();
            $('#resultPanel').show();
            gameMonitor.getScore();
        }
    }, 1000);
}

function Ship(ctx) {
    gameMonitor.im.loadImage(['static/img/player.png']);
    this.width = 113;
    this.height = 97;
    this.left = gameMonitor.w / 2 - this.width / 2;
    this.top = gameMonitor.h - 2 * this.height;
    this.player = gameMonitor.im.createImage('static/img/player.png');

    this.paint = function () {
        ctx.drawImage(this.player, this.left, this.top, this.width, this.height);
    }

    this.setPosition = function (event) {
        if (gameMonitor.isMobile()) {
            var tarL = event.changedTouches[0].clientX;
            var tarT = event.changedTouches[0].clientY;
        }
        else {
            var tarL = event.offsetX;
            var tarT = event.offsetY;
        }
        this.left = tarL - this.width / 2 - 16;
        this.top = tarT - this.height / 2;
        if (this.left < 0) {
            this.left = 0;
        }
        if (this.left > 320 - this.width) {
            this.left = 320 - this.width;
        }
        if (this.top < 0) {
            this.top = 0;
        }
        if (this.top > gameMonitor.h - this.height) {
            this.top = gameMonitor.h - this.height;
        }
        this.paint();
    }

    this.controll = function () {
        var _this = this;
        var stage = $('#gamepanel');
        var currentX = this.left,
            currentY = this.top,
            move = false;
        stage.on(gameMonitor.eventType.start, function (event) {
            _this.setPosition(event);
            move = true;
        }).on(gameMonitor.eventType.end, function () {
            move = false;
        }).on(gameMonitor.eventType.move, function (event) {
            event.preventDefault();
            if (move) {
                _this.setPosition(event);
            }

        });
    }

    this.eat = function (foodlist) {
        for (var i = foodlist.length - 1; i >= 0; i--) {
            var f = foodlist[i];
            if (f) {
                var l1 = this.top + this.height / 2 - (f.top + f.height / 2);
                var l2 = this.left + this.width / 2 - (f.left + f.width / 2);
                var l3 = Math.sqrt(l1 * l1 + l2 * l2);
                if (l3 <= this.height / 2 + f.height / 2) {
                    foodlist[f.id] = null;

                    if(f.type < 4){
                        $('#score').html(gameMonitor.score+=f.type);
                    }else if(f.type == 4){
                        $('#score').html(gameMonitor.score-=4);
                    }
                    else if(f.type == 5){
                        $('#score').html(gameMonitor.score-=5);
                    }
                }
            }

        }
    }
}


function randoms(n, m) {
    var c = m - n + 1;
    return Math.floor(Math.random() * c + n);
}

function Food(type, left, id) {
    this.speedUpTime = 300;
    this.id = id;
    this.type = type;
    this.width = 50;
    this.height = 50;
    this.left = left;
    this.top = -50;
    this.speed = 0.01 * Math.pow(1.2, Math.floor(gameMonitor.time/this.speedUpTime));
//    this.speed = 0.8;
    this.loop = 0;

    var p;

    switch(this.type){
        case 1:
            p = "static/img/food1.png";
            break;
        case 2:
            p = "static/img/food2.png";
            break;
        case 3:
            p = "static/img/food3.png";
            break;
        case 4:
            p = "static/img/food4.png";
            break;
        case 5:
            p = "static/img/food5.png";
            break;
        case 6:
            p = "static/img/food6.png";
            break;
    }
    this.pic = gameMonitor.im.createImage(p);
}
Food.prototype.paint = function (ctx) {
    ctx.drawImage(this.pic, this.left, this.top, this.width, this.height);
};
Food.prototype.move = function (ctx) {
    if (gameMonitor.time % this.speedUpTime == 0) {
        this.speed *= 1.2;
    }
    this.top += ++this.loop * this.speed;
    if (this.top > gameMonitor.h) {
        gameMonitor.foodList[this.id] = null;
    }
    else {
        this.paint(ctx);
    }
};


function ImageMonitor() {
    var imgArray = [];
    return {
        createImage: function (src) {
            return typeof imgArray[src] != 'undefined' ? imgArray[src] : (imgArray[src] = new Image(), imgArray[src].src = src, imgArray[src])
        },
        loadImage: function (arr, callback) {
            for (var i = 0, l = arr.length; i < l; i++) {
                var img = arr[i];
                imgArray[img] = new Image();
                imgArray[img].onload = function () {
                    if (i == l - 1 && typeof callback == 'function') {
                        callback();
                    }
                }
                imgArray[img].src = img
            }
        }
    }
}


var gameMonitor = {
    w: 320,
    h: 568,
    bgWidth: 320,
    bgHeight: 568,
    time: 0,
    timmer: null,
    bgSpeed: 2,
    bgloop: 0,
    score: 0,
    im: new ImageMonitor(),
    foodList: [],
    bgDistance: 0,//背景位置
    eventType: {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
    },
    init: function () {
        var _this = this;
        var canvas = document.getElementById('stage');
        var ctx = canvas.getContext('2d');

        //绘制背景
        var bg = new Image();
        _this.bg = bg;
        bg.onload = function () {
            ctx.drawImage(bg, 0, 0, _this.bgWidth, _this.bgHeight);
        };
        bg.src = 'static/img/gameBg.jpg';

        _this.initListener(ctx);


    },
    initListener: function (ctx) {
        var _this = this;
        var body = $(document.body);
        $('#stage').on(gameMonitor.eventType.move, function (event) {
            event.preventDefault();
        });
        body.on(gameMonitor.eventType.start, '.playagain,.goBtn', function () {
            $('#resultPanel').hide();
            $(".formBox ul li input").val("");
            var canvas = document.getElementById('stage');
            var ctx = canvas.getContext('2d');
            _this.ship = new Ship(ctx);
            _this.ship.controll();
            _this.reset();
            _this.run(ctx);
            counts();
        });

        $("#music").attr('src', 'static/img/music.mp3');

        var m = document.getElementById("music");
        m.play();
        $('.sound').removeClass('i');
        $('.sound').click(function (e) {
            if (m.paused) {
                m.play();
                $('.sound').removeClass('i');
            } else {
                m.pause();
                $('.sound').addClass('i');
            }
        });

        body.on(gameMonitor.eventType.start, '#frontpage', function () {
            $('#frontpage').css('left', '-100%');
        });

        body.on(gameMonitor.eventType.start, '#guidePanel', function () {
            $(this).hide();
            _this.ship = new Ship(ctx);
            _this.ship.paint();
            _this.ship.controll();
            gameMonitor.run(ctx);
//            counts();
        });

        body.on(gameMonitor.eventType.start, '.share', function () {
            $('.weixin-share').show().on(gameMonitor.eventType.start, function () {
                $(this).hide();
            });
        });

    },
    rollBg: function (ctx) {
        ctx.drawImage(this.bg, 0, this.bgDistance, this.bgWidth, this.bgHeight);
    },
    run: function (ctx) {
        var _this = gameMonitor;
//		ctx.clearRect(0, 0, _this.bgWidth, _this.bgHeight);
        _this.rollBg(ctx);

        //绘制飞船
        _this.ship.paint();
        _this.ship.eat(_this.foodList);


        //产生月饼
        _this.genorateFood();

        //绘制月饼
        for (i = _this.foodList.length - 1; i >= 0; i--) {
            var f = _this.foodList[i];
            if (f) {
                f.paint(ctx);
                f.move(ctx);
            }

        }
        _this.timmer = setTimeout(function () {
            gameMonitor.run(ctx);
        }, Math.round(1000 / 100));

        _this.time++;
    },
    stop: function () {
        var _this = this;
        $('#stage').off(gameMonitor.eventType.start + ' ' + gameMonitor.eventType.move);

        setTimeout(function () {
            clearTimeout(_this.timmer);
        }, 0);

    },
    genorateFood: function () {
        var genRate = 80; //产生月饼的频率
        var random = Math.random();
        if (random * genRate > genRate - 1) {
            var left = Math.random() * (this.w - 50);
//            var type = Math.floor(left) % 2 == 0 ? 0 : 1;
            var type = Math.ceil(Math.random() * 5);
            var id = this.foodList.length;
            var f = new Food(type, left, id);
            this.foodList.push(f);
        }
    },
    reset: function () {
        this.foodList = [];
        this.bgloop = 0;
        this.score = 0;
        this.timmer = 0;
        this.time = 0;
        $('#score').html(this.score);
    },
    getScore: function () {
        var time = Math.floor(this.time / 60);
        var score = this.score;
        var user = 1;
        $("#last-score").html(score);
    },
    isMobile: function () {
        var sUserAgent = navigator.userAgent.toLowerCase(),
            bIsIpad = sUserAgent.match(/ipad/i) == "ipad",
            bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os",
            bIsMidp = sUserAgent.match(/midp/i) == "midp",
            bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4",
            bIsUc = sUserAgent.match(/ucweb/i) == "ucweb",
            bIsAndroid = sUserAgent.match(/android/i) == "android",
            bIsCE = sUserAgent.match(/windows ce/i) == "windows ce",
            bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile",
            bIsWebview = sUserAgent.match(/webview/i) == "webview";
        return (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM);
    }
}
if (!gameMonitor.isMobile()) {
    gameMonitor.eventType.start = 'mousedown';
    gameMonitor.eventType.move = 'mousemove';
    gameMonitor.eventType.end = 'mouseup';
}

gameMonitor.init();


Zepto(function ($) {
    $('.load-img').hide();
    $('#wrap').show();
    $('body').css('height', $(document).height() + 'px');
});

$('.start').click(function () {
    $('.page1').hide();
    $('.page2').show();
});

$('.goBtn').click(function () {
    $('#container').show();
});

$('ul.btn-list li').eq(1).bind("touchstart",function(){
    $(".roleBox").show();
});