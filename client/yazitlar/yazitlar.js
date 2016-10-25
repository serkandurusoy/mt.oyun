Template.yazitlar.onCreated(function() {

  this.aktifDers = new ReactiveVar();

  this.subscribe('mufredatlar', () => {
    Tracker.afterFlush(() => {
      const ilkDers = M.C.Dersler.findOne({}, {sort: {createdAt: 1}});
      this.aktifDers.set(ilkDers._id);
    })
  });
  this.subscribe('fsdersicerik');
});

Template.yazitlar.onRendered(function() {
  this.mufredatKaydirGerekli = new ReactiveVar(false);
  this.autorun(() => {
    const aktifDers = this.aktifDers.get();
    if (aktifDers) {
      Tracker.afterFlush(() => {
        this.mufredatKaydirGerekli.set(this.$('.mufredatWrapper > div').height() > this.$('.mufredatWrapper').innerHeight());
      })
    }
  })
});

Template.yazitlar.helpers({
  dersler() {
    const derslerCursor = M.C.Dersler.find({}, {sort: {createdAt: 1}});
    return derslerCursor.count() && derslerCursor;
  },
  dersKaydirGerekli() {
    return M.C.Dersler.find().count() > 6;
  },
  mufredat() {
    const aktifDers = Template.instance().aktifDers.get();
    const aktifEgitimYili = M.C.AktifEgitimYili.findOne();
    if (aktifDers && aktifEgitimYili) {
      const mufredat = M.C.Mufredat.findOne({
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
  mufredatKaydirGerekli() {
    return Template.instance().mufredatKaydirGerekli.get();
  }
});

let dersIcerikView;

Template.yazitlar.events({
  'click .muhurGrup'(e,t) {
    t.aktifDers.set(this._id);
  },
  'click .sol'(e,t) {
    t.$('.muhurGruplariWrapper').animate({
      scrollLeft: '-=128'
    }, 300);
  },
  'click .sag'(e,t) {
    t.$('.muhurGruplariWrapper').animate({
      scrollLeft: '+=128'
    }, 300);
  },
  'click .yukari'(e,t) {
    t.$('.mufredatWrapper').animate({
      scrollTop: '-=128'
    }, 300);
  },
  'click .asagi'(e,t) {
    t.$('.mufredatWrapper').animate({
      scrollTop: '+=128'
    }, 300);
  },
  'click [data-trigger="openDersIcerikModal"]'(e,t) {
    e.preventDefault();
    const icerik = this;
    const data = {
      fileName: icerik.name(),
      url: icerik.url({auth: false})
    };

    dersIcerikView = Blaze.renderWithData(Template.dersIcerikModal, data, document.getElementsByTagName('body')[0]);

  }
});

Template.dersIcerikModal.onRendered(function() {
  PDFJS.workerSrc = '/packages/pascoual_pdfjs/build/pdf.worker.js';
  const modalWidth = $('#pdfcontainer').width();
  const modalHeight = $('#pdfcontainer').height();

  const url = this.data.url;
  let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1,
    canvas = document.getElementById('pdfcanvas'),
    ctx = canvas.getContext('2d');

  function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(page => {
      let viewport = page.getViewport(1);
      const ws = modalWidth / viewport.width;
      const hs = modalHeight / viewport.height;
      scale = hs < ws ? hs : ws;
      viewport = page.getViewport(scale);

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderTask = page.render({canvasContext: ctx, viewport: viewport});

      renderTask.promise.then(() => {
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

  PDFJS.getDocument(url).then(pdfDoc_ => {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = pdfDoc.numPages;
    renderPage(pageNum);
  });

});

Template.dersIcerikModal.events({
  'click [data-trigger="closeDersIcerikModal"]'(e,t) {
    e.preventDefault();
    Blaze.remove(dersIcerikView);
  }
});
