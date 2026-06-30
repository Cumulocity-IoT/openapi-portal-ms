import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("ItemsController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("GET /items returns an array", () => {
    return request(app.getHttpServer()).get("/items").expect(200).expect((res) => {
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  it("GET /items?category=electronics filters by category", () => {
    return request(app.getHttpServer())
      .get("/items?category=electronics")
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        res.body.forEach((item: any) => expect(item.category).toBe("electronics"));
      });
  });

  it("GET /items/item-001 returns the correct item", () => {
    return request(app.getHttpServer()).get("/items/item-001").expect(200).expect((res) => {
      expect(res.body.id).toBe("item-001");
    });
  });

  it("GET /items/unknown-id returns 404", () => {
    return request(app.getHttpServer()).get("/items/unknown-id").expect(404);
  });

  it("GET /items/counts/by-category returns category counts", () => {
    return request(app.getHttpServer())
      .get("/items/counts/by-category")
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty("category");
        expect(res.body[0]).toHaveProperty("count");
      });
  });
});
