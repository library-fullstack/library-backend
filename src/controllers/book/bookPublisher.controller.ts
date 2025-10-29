import { Request, Response } from "express";
import {
  getAllPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
} from "../../services/book/publisher.service.ts";

const getAllPublishersController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const list = await getAllPublishers();
    res.status(200).json(list);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const createPublisherController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await createPublisher(req.body);
    res.status(201).json({ message: "Thêm nhà xuất bản thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const updatePublisherController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await updatePublisher(id, req.body);
    res.status(200).json({ message: "Cập nhật nhà xuất bản thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const deletePublisherController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await deletePublisher(id);
    res.status(200).json({ message: "Xoá nhà xuất bản thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export {
  getAllPublishersController,
  createPublisherController,
  updatePublisherController,
  deletePublisherController,
};
