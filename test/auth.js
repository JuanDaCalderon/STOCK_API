const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../middleware/is-auth');
const createAuthMiddleware = require('../middleware/create-auth');

describe('Auth middleware', () => {
    it('should auth_create be false if needAuth query param is not defined', () => {
        const req = {
            query: {
                needAuth: undefined
            }
        }
        createAuthMiddleware(req, {}, () => {});
        expect(req).to.have.property('auth_create', false);
    });
    it('should continue if the auth_create property is true', () => {
        const req = {
            auth_create: true,
            get: function () {
                return null
            }
        }
        expect(authMiddleware.bind(this, req, {}, () => {})).to.not.throw();
    });
    it('should throw an error if no authorization header is present', () => {
        const req = {
            get: function () {
                return null
            }
        }
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('Se necesita un Authorization-Token para acceder a este recurso');
    });
    it('should throw an error if the token cannot be verified', () => {
        const req = {
            get: function() {
              return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            }
          };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('El token suministrado no coincide con el de ningún usuario');
    });
    it('should yield a userId after decoding the token', () => {
        const req = {
            get: function () {
                return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjQzMzIzMTIzIiwibmFtZSI6Ikp1YW4gRGF2aWQiLCJpYXQiOjg3ODU0NTQ1NH0.AniwrsjXX7yW3XnJd7EUhWxteH7fkNfet3A-_JZ35Ss';
            }
        };
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({ id: '12' });
        authMiddleware(req, {}, () => {});
        expect(req).to.have.property('id');
        expect(req).to.have.property('id', '12');
        expect(jwt.verify.called).to.be.true;
        jwt.verify.restore();
    });
})