Template.yazitlar.onCreated(function() {
  var template = this;

  template.aktifDers = new ReactiveVar();

  template.subscribe('mufredatlar', function() {
    Tracker.afterFlush(function() {
      var ilkDers = M.C.Dersler.findOne({}, {sort: {createdAt: 1}});
      template.aktifDers.set(ilkDers._id);
    })
  });
  template.subscribe('fsdersicerik');
});

Template.yazitlar.onRendered(function() {
  var template = this;
  template.mufredatKaydirGerekli = new ReactiveVar(false);
  template.autorun(function(){
    var aktifDers = template.aktifDers.get();
    if (aktifDers) {
      Tracker.afterFlush(function(){
        template.mufredatKaydirGerekli.set($('.mufredatWrapper > div').height() > $('.mufredatWrapper').innerHeight());
      })
    }
  })
});

Template.yazitlar.helpers({
  dersler: function() {
    var derslerCursor = M.C.Dersler.find({}, {sort: {createdAt: 1}});
    return derslerCursor.count() && derslerCursor;
  },
  dersKaydirGerekli: function() {
    return M.C.Dersler.find().count() > 6;
  },
  mufredat: function() {
    var aktifDers = Template.instance().aktifDers.get();
    var aktifEgitimYili = M.C.AktifEgitimYili.findOne();
    if (aktifDers && aktifEgitimYili) {
      var mufredat = M.C.Mufredat.findOne({
        kurum: Meteor.user().kurum,
        sinif: Meteor.user().sinif,
        egitimYili: aktifEgitimYili.egitimYili,
        ders: aktifDers
      });
      return mufredat;
    } else {
      return false;
    }
  },
  mufredatKaydirGerekli: function() {
    return Template.instance().mufredatKaydirGerekli.get();
  }
});

var dersIcerikView;

Template.yazitlar.events({
  'click .muhurGrup': function(e,t) {
    t.aktifDers.set(this._id);
  },
  'click .sol': function(e,t) {
    t.$('.muhurGruplariWrapper').animate({
      scrollLeft: '-=128'
    }, 300);
  },
  'click .sag': function(e,t) {
    t.$('.muhurGruplariWrapper').animate({
      scrollLeft: '+=128'
    }, 300);
  },
  'click .yukari': function(e,t) {
    t.$('.mufredatWrapper').animate({
      scrollTop: '-=128'
    }, 300);
  },
  'click .asagi': function(e,t) {
    t.$('.mufredatWrapper').animate({
      scrollTop: '+=128'
    }, 300);
  },
  'click [data-trigger="openDersIcerikModal"]' : function(e,t) {
    e.preventDefault();
    var icerik = this;
    var data = {
      fileName: icerik.name(),
      url: icerik.url()
    };

    dersIcerikView = Blaze.renderWithData(Template.dersIcerikModal, data, document.getElementsByTagName('body')[0]);

  }
});

Template.dersIcerikModal.onRendered(function() {
  PDFJS.workerSrc = '/packages/pascoual_pdfjs/build/pdf.worker.js';
  var modalWidth = $('#pdfcontainer').width();
  var modalHeight = $('#pdfcontainer').height();

  var url = this.data.url;
  var pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1,
    canvas = document.getElementById('pdfcanvas'),
    ctx = canvas.getContext('2d');

  function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(function(page) {
      var viewport = page.getViewport(1);
      var ws = modalWidth / viewport.width;
      var hs = modalHeight / viewport.height;
      scale = hs < ws ? hs : ws;
      viewport = page.getViewport(scale);

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      var renderTask = page.render({canvasContext: ctx, viewport: viewport});

      renderTask.promise.then(function () {
        pageRendering = false;
        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          pageNumPending = null;
        }
      });
    });

    document.getElementById('page_num').textContent = pageNum;
  }

  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }

  function onPrevPage() {
    if (pageNum <= 1) {
      return;
    }
    pageNum--;
    queueRenderPage(pageNum);
  }
  document.getElementById('prev').addEventListener('click', onPrevPage);

  function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
      return;
    }
    pageNum++;
    queueRenderPage(pageNum);
  }
  document.getElementById('next').addEventListener('click', onNextPage);

  PDFJS.getDocument(url).then(function (pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = pdfDoc.numPages;
    renderPage(pageNum);
  });

});

Template.dersIcerikModal.events({
  'click [data-trigger="closeDersIcerikModal"]': function(e,t) {
    e.preventDefault();
    Blaze.remove(dersIcerikView);
  }
});
