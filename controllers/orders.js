import Order from '../models/order.js'
import DistributorProduct from '../models/distributorProduct.js'
import { Distributor } from '../models/distributor.js'
import Notification from '../models/notification.js'

export async function create(req, res) {
  try {
    const { distributorId, items, fulfillmentType, deliveryAddress, preferredWindow, notes } = req.body

    const distributor = await Distributor.findById(distributorId)
    if (!distributor) return res.status(404).json({ err: 'Distributor not found' })

    const snapshottedItems = await Promise.all(
      items.map(async ({ productId, quantity }) => {
        const product = await DistributorProduct.findById(productId)
        if (!product) throw new Error(`Product ${productId} not found`)
        return {
          product: product._id,
          name: product.name,
          unitSize: product.unitSize,
          priceAtOrder: product.pricePerCase,
          quantity,
        }
      })
    )

    const order = await Order.create({
      business: req.user.profileId,
      distributor: distributor.profile,
      items: snapshottedItems,
      status: 'pending',
      fulfillmentType,
      deliveryAddress,
      preferredWindow,
      notes,
    })

    await Notification.create({
      recipient: distributor.profile,
      type: 'order_request',
      message: 'A business has submitted a new order request.',
      relatedId: order._id,
    })

    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getBusinessOrders(req, res) {
  try {
    const orders = await Order.find({ business: req.user.profileId })
      .populate('distributor', 'name photo')
      .populate('items.product')
      .sort('-createdAt')

    res.json(orders)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getDistributorOrders(req, res) {
  try {
    const orders = await Order.find({ distributor: req.user.profileId })
      .populate('business', 'name photo')
      .populate('items.product')
      .sort('-createdAt')

    res.json(orders)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function quote(req, res) {
  try {
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ err: 'Order not found' })
    if (order.distributor.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ err: 'Not authorized' })
    }

    const { estimatedTotal, deliveryFee, eta, fulfillmentType, pickupAddress, pickupWindow, distributorNotes } = req.body

    order.estimatedTotal = estimatedTotal
    order.deliveryFee = deliveryFee
    order.eta = eta
    order.fulfillmentType = fulfillmentType
    order.pickupAddress = pickupAddress
    order.pickupWindow = pickupWindow
    order.distributorNotes = distributorNotes
    order.status = 'quoted'
    await order.save()

    await Notification.create({
      recipient: order.business,
      type: 'order_quoted',
      message: 'Your order has been quoted. Review and accept to proceed.',
      relatedId: order._id,
    })

    res.json(order)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function accept(req, res) {
  try {
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ err: 'Order not found' })
    if (order.business.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ err: 'Not authorized' })
    }
    if (order.status !== 'quoted') {
      return res.status(400).json({ err: 'Order must be in quoted status to accept' })
    }

    order.status = 'accepted'
    await order.save()

    await Notification.create({
      recipient: order.distributor,
      type: 'order_accepted',
      message: 'A business has accepted your quote.',
      relatedId: order._id,
    })

    res.json(order)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function updateStatus(req, res) {
  try {
    const { status } = req.body
    const allowed = ['in_transit', 'delivered', 'ready_for_pickup', 'picked_up', 'cancelled', 'declined']
    if (!allowed.includes(status)) {
      return res.status(400).json({ err: 'Invalid status' })
    }

    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ err: 'Order not found' })
    if (order.distributor.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ err: 'Not authorized' })
    }

    order.status = status
    await order.save()

    if (status === 'declined') {
      await Notification.create({
        recipient: order.business,
        type: 'order_declined',
        message: 'Your order has been declined by the distributor.',
        relatedId: order._id,
      })
    } else if (status === 'delivered' || status === 'picked_up') {
      await Notification.create({
        recipient: order.business,
        type: 'order_fulfilled',
        message: 'Your order has been fulfilled.',
        relatedId: order._id,
      })
    }

    res.json(order)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
