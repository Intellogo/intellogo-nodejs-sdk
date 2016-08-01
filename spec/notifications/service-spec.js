var WebService = require('../../lib/notifications/web-service');

describe('Notifications Service', function () {
    var dummyFunction,
        service,
        hook,
        hookId;
    beforeEach (function () {
        dummyFunction = jasmine.createSpy('dummyFn');
        service = new WebService({});
        hook = service.registerWebhook(dummyFunction);
        hookId = service._extractHookId(hook);
    });

    it('should properly register webhooks', function () {
        expect(service.notifiers[hookId]).toEqual(dummyFunction);
    });

    it('should properly handle webhooks', function (done) {
        var dummyReq = {
            url: hook,
            method: 'POST',
            body: {
                data: 'data'
            }
        },
        dummyRes = {
            end: function () {}
        };
        service._handleWebhookRequest(dummyReq, dummyRes);
        setTimeout(() => {
            expect(dummyFunction).toHaveBeenCalledWith(undefined, dummyReq.body);
            expect(service.notifiers[hookId]).toBeFalsy();
            done();
        }, 10);
    });

    it('should properly handle webhooks with no body', function (done) {
        var dummyReq = {
            url: hook,
            method: 'POST'
        },
        dummyRes = {
            end: function () {}
        };
        service._handleWebhookRequest(dummyReq, dummyRes);
        setTimeout(() => {
            expect(dummyFunction).toHaveBeenCalledWith(undefined, undefined);
            expect(service.notifiers[hookId]).toBeFalsy();
            done();
        }, 10);
    });

    it('should properly handle webhooks with errors', function (done) {
        var dummyReq = {
            url: hook,
            method: 'POST',
            body: {
                error: 'error',
                details: 'details'
            }
        },
        dummyRes = {
            end: function () {}
        };
        service._handleWebhookRequest(dummyReq, dummyRes);
        setTimeout(() => {
            expect(dummyFunction).toHaveBeenCalledWith('error', dummyReq.body);
            expect(service.notifiers[hookId]).toBeFalsy();
            done();
        }, 10);
    });

    it('should only respond to POST requests', function (done) {
        var dummyReq = {
            url: hook,
            method: 'GET',
            body: {
                data: 'data'
            }
        },
        dummyRes = {
            end: function () {}
        };
        service._handleWebhookRequest(dummyReq, dummyRes);
        setTimeout(() => {
            expect(dummyFunction).not.toHaveBeenCalled();
            expect(service.notifiers[hookId]).toEqual(dummyFunction);
            done();
        }, 10);
    });

});
