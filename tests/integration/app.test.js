const superTest =require('supertest');
const app = require('../../app');
const { MONGO_URI } = process.env;
var mongoose = require('mongoose');
var mongoDb= MONGO_URI;
mongoose.connect(mongoDb);

let server;
describe("App Module Integration Testing", ()=>{
    test('Has a module',(done)=>{
     expect(app).toBeDefined();
     done();
    });
    beforeAll(()=>{
      server = app.listen(2000);
    });

    afterAll((done)=>{
      //mongoose.connection.close();
       server.close(done);
    });

    describe("Homepage route",  ()=>{
        it('Should return 403(without token)',async ()=>{
           await superTest(server)
            .get('/api/v1/homepage')
            .expect(403);
        });
    });


    // Registering Testing 
    describe("Registering User", ()=>{
        it("Should parameters validations",  async ()=>{
          await superTest(server).post('/api/v1/register')
          .set('Accept', 'application/json')
          .expect(400);
        });
    });


    // Logging Testing 
    describe("Logging User", ()=>{

        it("Should show : email and password are required",  async ()=>{
          await superTest(server).post('/api/v1/login')
          .set('Accept', 'application/json')
          .expect(400);
        });

        it("Should fails with invalid credentials",  async ()=>{
            const user = {email:'test@example.com', password: ((new Date()).toString())};
            await superTest(server).post('/api/v1/login')
            .send(user)
            .set('Accept', 'application/json')
            .expect(400);
        });
    });



    describe('404 Page',()=>{
      it('Should return 404 not-found page', async ()=>{
         await superTest(server)
         .get('/custom-ur-link')
         .expect(404);
      })
    });
});

